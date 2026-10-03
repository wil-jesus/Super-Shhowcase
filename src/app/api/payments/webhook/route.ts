import type Stripe from "stripe";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe-server";

function paymentIntentIdFromCharge(charge: Stripe.Charge): string | null {
  if (typeof charge.payment_intent === "string") return charge.payment_intent;
  return charge.payment_intent?.id ?? null;
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await prisma.payment.updateMany({
          where: { stripeId: paymentIntent.id },
          data: { status: "ON_HOLD" },
        });
        break;
      }
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await prisma.payment.updateMany({
          where: { stripeId: paymentIntent.id },
          data: { status: "FAILED" },
        });
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const stripeId = paymentIntentIdFromCharge(charge);
        if (stripeId) {
          await prisma.payment.updateMany({
            where: { stripeId },
            data: { status: "REFUNDED" },
          });
        }
        break;
      }
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao processar webhook" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
