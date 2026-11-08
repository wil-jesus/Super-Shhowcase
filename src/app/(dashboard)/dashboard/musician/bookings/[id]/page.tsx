"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { updateBookingStatus, useBooking } from "@/lib/hooks/use-bookings";
import { BOOKING_STATUS_COLORS as statusColors } from "@/lib/booking-status";
import { formatBRL } from "@/lib/event-format";

const statusLabels: Record<string, string> = {
  REQUESTED: "Aguardando sua resposta", PENDING_MUSICIAN: "Aguardando sua resposta",
  ACCEPTED: "Aceita", CONFIRMED: "Confirmada", PENDING_PAYMENT: "Aguardando pagamento do cliente",
  PAYMENT_CLAIMED: "Confirme o recebimento", PAID: "Pago", IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluída", REJECTED: "Recusada", CANCELLED: "Cancelada", DISPUTED: "Em disputa",
};

interface MessageItem { id: string; content: string; createdAt: string }

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Falha ao carregar as mensagens");
  return response.json() as Promise<{ messages?: MessageItem[]; data?: MessageItem[] }>;
};

export default function MusicianBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { booking, isLoading, mutate } = useBooking(id);
  const [deciding, setDeciding] = useState<string | null>(null);
  const [error, setError] = useState("");

  if (isLoading) return <div className="mx-auto max-w-3xl space-y-4"><Skeleton className="h-8 w-1/3" /><Skeleton className="h-48 w-full rounded-xl" /></div>;
  if (!booking) return <div className="py-16 text-center"><p className="text-gray-500">Contratação não encontrada</p><Button variant="secondary" className="mt-4" onClick={() => router.back()}>Voltar</Button></div>;

  const eventDate = new Date(booking.event.date);
  const canDecide = booking.status === "REQUESTED" || booking.status === "PENDING_MUSICIAN";
  const canConfirmService = ["PAID", "IN_PROGRESS"].includes(booking.status) && !booking.musicianConfirmedAt;
  const showFee = ["PAID", "IN_PROGRESS", "COMPLETED"].includes(booking.status) && booking.platformFee != null;

  const decide = async (status: string, question: string) => {
    if (!window.confirm(question)) return;
    setDeciding(status);
    setError("");
    try {
      await updateBookingStatus(booking.id, status);
      await mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao atualizar a contratação");
    } finally {
      setDeciding(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/musician" className="text-sm text-brand-600 hover:text-brand-700">← Voltar</Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{booking.event.title}</h1>
          <p className="text-sm text-gray-600">{eventDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
        </div>
        <Badge color={statusColors[booking.status] ?? "gray"}>{statusLabels[booking.status] ?? booking.status}</Badge>
      </div>

      <Card>
        <CardHeader><h2 className="font-semibold text-gray-900">Detalhes do evento</h2></CardHeader>
        <CardBody className="space-y-3">
          {booking.client && <DetailRow label="Cliente" value={booking.client.user.name} />}
          <DetailRow label="Tipo" value={booking.event.type} />
          <DetailRow label="Data" value={eventDate.toLocaleString("pt-BR")} />
          <DetailRow label="Local" value={booking.event.addressLabel ?? "Não informado"} />
          {booking.value != null && <DetailRow label="Valor" value={formatBRL(booking.value)} />}
          {showFee && <DetailRow label={`Taxa da plataforma (${Number(booking.feeRate ?? 0)}%)`} value={formatBRL(booking.platformFee ?? 0)} />}
          {showFee && <DetailRow label="Líquido para você" value={          formatBRL(booking.netAmount ?? 0)} />}
          {booking.event.notes && <div><p className="text-xs text-gray-500">Observações</p><p className="mt-1 text-sm text-gray-700">{booking.event.notes}</p></div>}
          {booking.receipt && (
            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs text-gray-500">Comprovante enviado pelo cliente</p>
              <a
                href={booking.receipt.url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                Abrir comprovante
              </a>
            </div>
          )}
        </CardBody>
      </Card>

      {canDecide && (
        <Card>
          <CardBody className="space-y-3 text-center">
            <p className="text-sm text-gray-600">Você deseja aceitar esta solicitação?</p>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-center gap-3">
              <Button onClick={() => decide("ACCEPTED", "Aceitar esta contratação?")} loading={deciding === "ACCEPTED"} disabled={deciding !== null}>Aceitar</Button>
              <Button variant="secondary" onClick={() => decide("REJECTED", "Recusar esta contratação?")} loading={deciding === "REJECTED"} disabled={deciding !== null}>Recusar</Button>
            </div>
          </CardBody>
        </Card>
      )}

      {booking.status === "PAYMENT_CLAIMED" && (
        <Card>
          <CardBody className="space-y-3 text-center">
            <p className="text-sm text-gray-600">O cliente informou que pagou {booking.value != null ? formatBRL(booking.value) : ""}. Você recebeu o Pix?</p>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-center gap-3">
              <Button onClick={() => decide("PAID", "Confirmar o recebimento do pagamento? A taxa da plataforma será registrada.")} loading={deciding === "PAID"} disabled={deciding !== null}>Recebi o pagamento</Button>
              <Button variant="secondary" onClick={() => decide("PENDING_PAYMENT", "Informar que o pagamento NÃO foi recebido?")} loading={deciding === "PENDING_PAYMENT"} disabled={deciding !== null}>Não recebi</Button>
            </div>
          </CardBody>
        </Card>
      )}

      {canConfirmService && (
        <Card>
          <CardBody className="space-y-3 text-center">
            <p className="text-sm text-gray-600">Depois do evento, confirme que o serviço foi realizado.</p>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <Button onClick={() => decide("COMPLETED", "Confirmar que o serviço foi realizado?")} loading={deciding === "COMPLETED"} disabled={deciding !== null}>Confirmar serviço realizado</Button>
          </CardBody>
        </Card>
      )}

      <Card><CardHeader><h2 className="font-semibold text-gray-900">Mensagens</h2></CardHeader><CardBody><ChatPanel bookingId={booking.id} /></CardBody></Card>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex items-center justify-between"><span className="text-sm text-gray-500">{label}</span><span className="text-sm font-medium text-gray-900">{value}</span></div>;
}

function ChatPanel({ bookingId }: { bookingId: string }) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const { data, mutate } = useSWR(`/api/bookings/${bookingId}/messages`, fetcher, { refreshInterval: 5000 });

  useEffect(() => { setMessages(data?.messages ?? data?.data ?? []); }, [data]);

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim()) return;
    setSending(true);
    try {
      const response = await fetch(`/api/bookings/${bookingId}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: input.trim() }) });
      if (!response.ok) throw new Error("Falha ao enviar mensagem");
      setInput("");
      await mutate();
    } finally { setSending(false); }
  };

  return <div className="space-y-3"><div className="max-h-64 space-y-2 overflow-y-auto">{messages.length === 0 ? <p className="py-4 text-center text-sm text-gray-400">Nenhuma mensagem ainda.</p> : messages.map((message) => <div key={message.id} className="rounded-lg bg-gray-50 p-2"><p className="mb-0.5 text-xs text-gray-400">{new Date(message.createdAt).toLocaleString("pt-BR")}</p><p className="text-sm text-gray-700">{message.content}</p></div>)}</div><form onSubmit={handleSend} className="flex gap-2"><input type="text" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Digite uma mensagem..." className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500" /><Button type="submit" size="sm" loading={sending}>Enviar</Button></form></div>;
}
