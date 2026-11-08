import { BookingStatus, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyAdmins, notifyUser } from "@/lib/notifications";
import { checkMusicianFeeDelinquency, FEE_DELINQUENCY_MESSAGE } from "@/lib/fee-delinquency";
import { formatBRL } from "@/lib/event-format";
import { decisionEmail } from "@/lib/email";
import {
  ACTIVE_BOOKING_STATUSES,
  BookingActor,
  calculateFee,
  canActorTransition,
  hasPayableValue,
  isKnownTransition,
} from "@/lib/booking-flow";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: {
      event: { select: { id: true, title: true, date: true, type: true, addressLabel: true, notes: true } },
      musician: {
        select: {
          id: true,
          userId: true,
          stageName: true,
          photoUrl: true,
          verified: true,
          media: {
            where: { type: `PAYMENT_RECEIPT:${params.id}` },
            select: { id: true, url: true, createdAt: true },
            orderBy: { createdAt: "desc" },
          },
        },
      },
      client: { select: { id: true, userId: true, user: { select: { name: true } } } },
      payment: { select: { id: true, status: true, amount: true, platformFee: true } },
      reviews: { select: { id: true, rating: true, comment: true } },
    },
  });

  if (!booking) return NextResponse.json({ error: "Contratação não encontrada" }, { status: 404 });

  const isParticipant =
    booking.client.userId === session.user.id ||
    booking.musician.userId === session.user.id ||
    session.user.role === "ADMIN";
  if (!isParticipant) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const { userId: _musicianUserId, media: receipts, ...musician } = booking.musician;
  const { userId: _clientUserId, ...client } = booking.client;
  return NextResponse.json({ ...booking, musician, client, receipt: receipts[0] ?? null });
}

function isBookingStatus(value: unknown): value is BookingStatus {
  return typeof value === "string" && Object.values(BookingStatus).includes(value as BookingStatus);
}

const statusNotifications: Partial<
  Record<BookingStatus, { to: "client" | "musician"; type: string; title: string; body: (event: string) => string }>
> = {
  PENDING_PAYMENT: {
    to: "musician",
    type: "PENDING_PAYMENT",
    title: "Pagamento em andamento",
    body: (event) => `O cliente iniciou o pagamento direto de "${event}"`,
  },
  PAYMENT_CLAIMED: {
    to: "musician",
    type: "PAYMENT_CLAIMED",
    title: "Confirme o recebimento",
    body: (event) => `O cliente informou que pagou "${event}". Confirme o recebimento.`,
  },
  PAID: {
    to: "client",
    type: "PAID",
    title: "Pagamento confirmado",
    body: (event) => `O músico confirmou o recebimento de "${event}"`,
  },
};

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const status = body?.status;

    if (!isBookingStatus(status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: { client: true, musician: true, event: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Contratação não encontrada" }, { status: 404 });
    }

    if (!isKnownTransition(booking.status, status)) {
      return NextResponse.json(
        { error: `Transição inválida: ${booking.status} -> ${status}` },
        { status: 400 }
      );
    }

    const isAdmin = session.user.role === "ADMIN";
    const actor: BookingActor | null = isAdmin
      ? "admin"
      : booking.client.userId === session.user.id
        ? "client"
        : booking.musician.userId === session.user.id
          ? "musician"
          : null;

    if (!actor || !canActorTransition(booking.status, status, actor)) {
      return NextResponse.json({ error: "Sem permissão para esta ação" }, { status: 403 });
    }

    if (status === "ACCEPTED" && actor === "musician") {
      const delinquent = await checkMusicianFeeDelinquency(booking.musicianId, booking.musician.stageName);
      if (delinquent) return NextResponse.json({ error: FEE_DELINQUENCY_MESSAGE }, { status: 409 });
    }

    if ((status === "PENDING_PAYMENT" || status === "PAID") && !hasPayableValue(booking.value)) {
      return NextResponse.json(
        { error: "A contratação precisa ter um valor maior que zero para seguir ao pagamento" },
        { status: 400 }
      );
    }

    if (status === "ACCEPTED") {
      const start = new Date(booking.event.date);
      const end = new Date(start.getTime() + booking.event.durationHours * 60 * 60 * 1000);
      const activeBookings = await prisma.booking.findMany({
        where: {
          musicianId: booking.musicianId,
          status: { in: ACTIVE_BOOKING_STATUSES },
          id: { not: booking.id },
        },
        select: { event: { select: { date: true, durationHours: true } } },
      });

      const hasConflict = activeBookings.some((activeBooking) => {
        const activeStart = new Date(activeBooking.event.date);
        const activeEnd = new Date(
          activeStart.getTime() + activeBooking.event.durationHours * 60 * 60 * 1000
        );
        return activeStart < end && activeEnd > start;
      });

      if (hasConflict) {
        return NextResponse.json(
          { error: "Conflito de agenda: o músico já tem evento nesse horário" },
          { status: 409 }
        );
      }
    }

    const now = new Date();
    const data: Prisma.BookingUpdateManyMutationInput = { status };
    let feeCharge: Prisma.FeeChargeUncheckedCreateInput | null = null;
    let awaitingCounterpart = false;

    if (status === "PAYMENT_CLAIMED") {
      data.paymentClaimedAt = now;
    } else if (status === "PENDING_PAYMENT") {
      data.paymentClaimedAt = null;
    } else if (status === "PAID") {
      const fee = calculateFee(booking.value);
      data.paidAt = now;
      data.feeRate = fee.feeRate;
      data.platformFee = fee.platformFee;
      data.netAmount = fee.netAmount;
      feeCharge = { musicianId: booking.musicianId, bookingId: booking.id, amount: fee.platformFee };
    } else if (status === "COMPLETED") {
      // Conclusão exige a confirmação das duas partes; o admin resolve disputas sozinho.
      const clientConfirmedAt = booking.clientConfirmedAt ?? (actor === "client" || actor === "admin" ? now : null);
      const musicianConfirmedAt =
        booking.musicianConfirmedAt ?? (actor === "musician" || actor === "admin" ? now : null);
      data.clientConfirmedAt = clientConfirmedAt;
      data.musicianConfirmedAt = musicianConfirmedAt;

      if (clientConfirmedAt && musicianConfirmedAt) {
        data.completedAt = now;
      } else {
        awaitingCounterpart = true;
        delete data.status;
      }
    }

    // O filtro por status atual impede dupla transição (e FeeCharge duplicada) em requisições concorrentes.
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.booking.updateMany({
        where: { id: params.id, status: booking.status },
        data,
      });
      if (result.count === 0) return null;

      if (feeCharge) {
        await tx.feeCharge.create({ data: feeCharge });
        await notifyAdmins(tx, {
          type: "FEE_CHARGE_CREATED",
          title: `Nova taxa de ${formatBRL(Number(feeCharge.amount))} gerada por ${booking.musician.stageName} — aguardando cobrança`,
          body: `Taxa gerada para a contratação "${booking.event.title}".`,
          bookingId: booking.id,
        });
      }
      return tx.booking.findUnique({ where: { id: params.id } });
    });

    if (!updated) {
      return NextResponse.json(
        { error: "A contratação foi alterada por outra ação. Atualize e tente novamente." },
        { status: 409 }
      );
    }

    const notification = statusNotifications[status];
    if (notification) {
      try {
        await notifyUser({
          userId: notification.to === "client" ? booking.client.userId : booking.musician.userId,
          type: notification.type,
          title: notification.title,
          body: notification.body(booking.event.title),
          bookingId: booking.id,
        });
      } catch (notifyError) {
        console.error("[bookings] falha ao notificar", notifyError);
      }
    }

    if (status === "ACCEPTED" || status === "REJECTED") {
      const accepted = status === "ACCEPTED";
      const title = accepted ? "Contratação aceita" : "Contratação recusada";
      const body = accepted
        ? `${booking.musician.stageName} aceitou sua solicitação para "${booking.event.title}"`
        : `${booking.musician.stageName} recusou sua solicitação para "${booking.event.title}"`;
      try {
        await notifyUser({
          userId: booking.client.userId,
          type: accepted ? "ACCEPTED" : "REJECTED",
          title,
          body,
          bookingId: booking.id,
          email: decisionEmail(title, body),
        });
      } catch (notifyError) {
        console.error("[bookings] falha ao notificar cliente", notifyError);
      }
    }

    return NextResponse.json({ booking: updated, awaitingCounterpart });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}