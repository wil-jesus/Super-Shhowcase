import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe-server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { paymentId } = body;
    if (typeof paymentId !== "string" || !paymentId) {
      return NextResponse.json({ error: "paymentId obrigatório" }, { status: 400 });
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        payout: true,
        booking: {
          include: {
            musician: { select: { id: true, stripeAccountId: true } },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Pagamento não encontrado" }, { status: 404 });
    }

    if (payment.booking.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Evento precisa estar concluído para liberar repasse" },
        { status: 400 }
      );
    }

    if (payment.status !== "ON_HOLD") {
      return NextResponse.json({ error: "Pagamento não está retido" }, { status: 400 });
    }

    if (payment.payout) {
      return NextResponse.json({ error: "Repasse já realizado" }, { status: 409 });
    }

    const musicianAmount = Math.round((payment.amount - payment.platformFee) * 100);
    if (musicianAmount <= 0) {
      return NextResponse.json({ error: "Valor de repasse inválido" }, { status: 400 });
    }

    const stripeAccountId = payment.booking.musician.stripeAccountId;
    if (!stripeAccountId || !stripeAccountId.startsWith("acct_")) {
      return NextResponse.json(
        { error: "Músico sem conta Stripe Connect (acct_...). Cadastre stripeAccountId no perfil." },
        { status: 400 }
      );
    }

    const transfer = await stripe.transfers.create(
      {
        amount: musicianAmount,
        currency: "brl",
        destination: stripeAccountId,
        transfer_group: payment.bookingId,
      },
      { idempotencyKey: `payout-${payment.id}` }
    );

    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: "RELEASED" },
      }),
      prisma.payout.create({
        data: {
          paymentId: payment.id,
          musicianId: payment.booking.musicianId,
          amount: musicianAmount / 100,
          status: "PAID",
        },
      }),
    ]);

    return NextResponse.json({ message: "Repasse liberado", transferId: transfer.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao liberar repasse" }, { status: 500 });
  }
}