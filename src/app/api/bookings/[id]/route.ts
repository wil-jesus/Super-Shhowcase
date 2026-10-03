import { BookingStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: {
      event: { select: { id: true, title: true, date: true, type: true, addressLabel: true, notes: true } },
      musician: { select: { id: true, userId: true, stageName: true, photoUrl: true, verified: true } },
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

  const { userId: _musicianUserId, ...musician } = booking.musician;
  const { userId: _clientUserId, ...client } = booking.client;
  return NextResponse.json({ ...booking, musician, client });
}

const transitions: Record<BookingStatus, BookingStatus[]> = {
  REQUESTED: ["PENDING_MUSICIAN", "ACCEPTED", "CANCELLED"],
  PENDING_MUSICIAN: ["ACCEPTED", "REJECTED", "CANCELLED"],
  ACCEPTED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "DISPUTED"],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
  DISPUTED: ["CANCELLED", "COMPLETED"],
};

const musicianActions: BookingStatus[] = [
  "PENDING_MUSICIAN",
  "ACCEPTED",
  "REJECTED",
  "IN_PROGRESS",
  "COMPLETED",
];
const clientActions: BookingStatus[] = ["CONFIRMED", "CANCELLED"];

function isBookingStatus(value: unknown): value is BookingStatus {
  return typeof value === "string" && value in transitions;
}

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

    if (!transitions[booking.status].includes(status)) {
      return NextResponse.json(
        { error: `Transição inválida: ${booking.status} -> ${status}` },
        { status: 400 }
      );
    }

    const isClient = booking.client.userId === session.user.id;
    const isMusician = booking.musician.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (musicianActions.includes(status) && !isMusician && !isAdmin) {
      return NextResponse.json({ error: "Sem permissão para esta ação" }, { status: 403 });
    }

    if (clientActions.includes(status) && !isClient && !isAdmin) {
      return NextResponse.json({ error: "Sem permissão para esta ação" }, { status: 403 });
    }

    if (status === "ACCEPTED") {
      const start = new Date(booking.event.date);
      const end = new Date(start.getTime() + booking.event.durationHours * 60 * 60 * 1000);
      const activeBookings = await prisma.booking.findMany({
        where: {
          musicianId: booking.musicianId,
          status: { in: ["ACCEPTED", "CONFIRMED", "IN_PROGRESS"] },
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

    const updated = await prisma.booking.update({
      where: { id: params.id },
      data: { status },
    });

    return NextResponse.json({ booking: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}