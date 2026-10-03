"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import type { StripeCardElementOptions } from "@stripe/stripe-js";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useBooking } from "@/lib/hooks/use-bookings";
import { getStripe } from "@/lib/stripe";

const stripePromise = getStripe();
const cardOptions: StripeCardElementOptions = {
  style: {
    base: {
      color: "#111827",
      fontFamily: "inherit",
      fontSize: "16px",
      "::placeholder": { color: "#9ca3af" },
    },
    invalid: { color: "#b91c1c" },
  },
};

export default function PaymentPage() {
  const params = useParams();
  const id = params.id as string;
  const { booking, isLoading } = useBooking(id);

  if (isLoading) return <Skeleton className="mx-auto h-64 w-full max-w-md rounded-xl" />;
  if (!booking) return <p className="text-gray-500">Contratação não encontrada</p>;

  return (
    <Elements stripe={stripePromise}>
      <PaymentForm bookingId={id} musician={booking.musician.stageName} eventTitle={booking.event.title} eventDate={booking.event.date} amount={booking.value} />
    </Elements>
  );
}

function PaymentForm({
  bookingId,
  musician,
  eventTitle,
  eventDate,
  amount,
}: {
  bookingId: string;
  musician: string;
  eventTitle: string;
  eventDate: string;
  amount: number | null;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const handlePay = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!stripe || !elements) {
      setError("O pagamento ainda está carregando");
      return;
    }

    setProcessing(true);
    setError("");
    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? "Erro ao iniciar pagamento");
      if (!result?.clientSecret) throw new Error("Pagamento não foi inicializado corretamente");

      const card = elements.getElement(CardElement);
      if (!card) throw new Error("Campo do cartão não está disponível");

      const confirmation = await stripe.confirmCardPayment(result.clientSecret, {
        payment_method: { card },
      });
      if (confirmation.error) throw new Error(confirmation.error.message ?? "Cartão não aprovado");
      if (confirmation.paymentIntent?.status !== "succeeded") {
        throw new Error("O pagamento ainda não foi confirmado");
      }

      router.push(`/dashboard/client/bookings/${bookingId}?paid=1`);
      router.refresh();
    } catch (paymentError) {
      setError(paymentError instanceof Error ? paymentError.message : "Erro no pagamento");
      setProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Pagamento</h1>
      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3"><p className="text-sm text-red-700">{error}</p></div>}
      <Card>
        <CardBody>
          <div className="mb-4 text-center"><div className="mb-2 text-4xl">🔒</div><p className="text-sm text-gray-600">Pagamento seguro via Stripe</p></div>
          <div className="space-y-2 border-y border-gray-100 py-4">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Músico</span><span className="font-medium">{musician}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Evento</span><span className="font-medium">{eventTitle}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Data</span><span className="font-medium">{new Date(eventDate).toLocaleDateString("pt-BR")}</span></div>
          </div>
          {amount != null && <div className="flex items-center justify-between py-4"><span className="text-gray-600">Total</span><span className="text-2xl font-bold text-brand-600">R$ {amount.toFixed(2)}</span></div>}
          <form onSubmit={handlePay} className="space-y-4">
            <div className="rounded-lg border border-gray-300 px-3 py-3 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500"><CardElement options={cardOptions} /></div>
            <Button type="submit" loading={processing} disabled={!stripe} size="lg" className="w-full">Pagar com cartão</Button>
          </form>
          <p className="mt-4 text-center text-xs text-gray-400">O valor fica retido na plataforma e só é liberado ao músico após a conclusão do evento.</p>
        </CardBody>
      </Card>
    </div>
  );
}