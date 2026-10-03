import { Prisma } from "@prisma/client";
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

  try {
    const body = await req.json();
    const { bookingId } = body;
    if (typeof bookingId !== "string" || !bookingId) {
      return NextResponse.json({ error: "bookingId obrigatório" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { client: true, musician: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Contratação não encontrada" }, { status: 404 });
    }

    if (booking.client.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    if (booking.status !== "CONFIRMED") {
      return NextResponse.json(
        { error: "Pagamento só pode ser feito após confirmação" },
        { status: 400 }
      );
    }

    const existing = await prisma.payment.findUnique({ where: { bookingId } });
    if (existing) {
      return NextResponse.json({ error: "Pagamento já iniciado" }, { status: 409 });
    }

    const amount = booking.value ?? 0;
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
    }

    const platformFee = Math.round(amount * 0.12 * 100) / 100;
    const amountInCents = Math.round(amount * 100);
    if (amountInCents <= 0) {
      return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "brl",
      metadata: {
        bookingId,
        musicianId: booking.musicianId,
        clientId: booking.clientId,
      },
      automatic_payment_methods: { enabled: true },
    });

    try {
      const payment = await prisma.payment.create({
        data: {
          bookingId,
          stripeId: paymentIntent.id,
          amount,
          platformFee,
          status: "PENDING",
        },
      });

      return NextResponse.json({
        payment,
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error) {
      await stripe.paymentIntents.cancel(paymentIntent.id).catch(console.error);
      throw error;
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Pagamento já iniciado" }, { status: 409 });
    }

    console.error(error);
    return NextResponse.json({ error: "Erro ao processar pagamento" }, { status: 500 });
  }
}