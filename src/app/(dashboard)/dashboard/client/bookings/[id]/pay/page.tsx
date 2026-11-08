"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { updateBookingStatus, useBooking } from "@/lib/hooks/use-bookings";
import { formatBRL } from "@/lib/event-format";

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { booking, isLoading, mutate } = useBooking(id);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  if (isLoading) return <Skeleton className="mx-auto h-64 w-full max-w-md rounded-xl" />;
  if (!booking) return <p className="text-gray-500">Contratação não encontrada</p>;

  const payable = Number(booking.value ?? 0) > 0;
  const canClaim = ["ACCEPTED", "CONFIRMED", "PENDING_PAYMENT"].includes(booking.status);

  // ACCEPTED/CONFIRMED passam primeiro por PENDING_PAYMENT; depois o cliente informa o pagamento.
  const handleClaim = async () => {
    if (!window.confirm("Confirma que você já fez o pagamento diretamente ao músico?")) return;
    setProcessing(true);
    setError("");
    try {
      if (receiptFile) {
        const formData = new FormData();
        formData.set("file", receiptFile);
        const uploadResponse = await fetch(`/api/bookings/${booking.id}/receipt`, {
          method: "POST",
          body: formData,
        });
        if (!uploadResponse.ok) {
          const body = await uploadResponse.json().catch(() => null);
          throw new Error(body?.error ?? "Não foi possível enviar o comprovante");
        }
        setReceiptFile(null);
      }
      if (booking.status !== "PENDING_PAYMENT") await updateBookingStatus(booking.id, "PENDING_PAYMENT");
      await updateBookingStatus(booking.id, "PAYMENT_CLAIMED");
      await mutate();
      router.push(`/dashboard/client/bookings/${booking.id}`);
      router.refresh();
    } catch (claimError) {
      setError(claimError instanceof Error ? claimError.message : "Erro ao informar o pagamento");
      await mutate();
      setProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Pagamento direto</h1>
      {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3"><p className="text-sm text-red-700">{error}</p></div>}
      <Card>
        <CardBody>
          <div className="space-y-2 border-b border-gray-100 pb-4">
            <Row label="Músico" value={booking.musician.stageName} />
            <Row label="Evento" value={booking.event.title} />
            <Row label="Data" value={new Date(booking.event.date).toLocaleDateString("pt-BR")} />
          </div>
          <div className="flex items-center justify-between py-4">
            <span className="text-gray-600">Valor combinado</span>
            <span className="text-2xl font-bold text-brand-600">{payable ? formatBRL(booking.value as number | string) : "—"}</span>
          </div>
          <ol className="mb-4 list-decimal space-y-1 pl-5 text-sm text-gray-600">
            <li>Combine com o músico, pelo chat da contratação, a chave Pix.</li>
            <li>Faça o Pix diretamente ao músico no valor acima.</li>
            <li>Volte aqui e clique em &quot;Já paguei&quot;. O músico confirmará o recebimento.</li>
          </ol>
          {!payable && <p className="mb-4 text-sm text-red-600">Esta contratação não tem valor definido; defina um valor maior que zero antes de pagar.</p>}
          {!canClaim && <p className="mb-4 text-sm text-gray-500">Esta contratação não está aguardando pagamento.</p>}
          {canClaim && (
            <label className="mb-4 block text-sm text-gray-600">
              Comprovante do Pix (opcional)
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(event) => setReceiptFile(event.target.files?.[0] ?? null)}
                className="mt-2 block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:font-medium file:text-brand-700"
              />
              <span className="mt-1 block text-xs text-gray-400">Imagem ou PDF, até 5 MB.</span>
            </label>
          )}
          <Button onClick={handleClaim} loading={processing} disabled={!payable || !canClaim} size="lg" className="w-full">Já paguei</Button>
          <p className="mt-4 text-center text-xs text-gray-400">O pagamento é feito diretamente ao músico. A plataforma cobra uma taxa do músico após a confirmação.</p>
        </CardBody>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between text-sm"><span className="text-gray-500">{label}</span><span className="font-medium">{value}</span></div>;
}
