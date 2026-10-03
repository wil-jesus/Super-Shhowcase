"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useBooking } from "@/lib/hooks/use-bookings";

const statusColors: Record<string, "gray" | "green" | "yellow" | "red" | "blue" | "purple"> = {
  REQUESTED: "yellow", ACCEPTED: "blue", CONFIRMED: "green", IN_PROGRESS: "purple",
  COMPLETED: "green", REJECTED: "red", CANCELLED: "red", DISPUTED: "red",
};

const statusLabels: Record<string, string> = {
  REQUESTED: "Aguardando resposta", ACCEPTED: "Aceito pelo músico", CONFIRMED: "Confirmado",
  IN_PROGRESS: "Em andamento", COMPLETED: "Concluído", REJECTED: "Recusado",
  CANCELLED: "Cancelado", DISPUTED: "Em disputa",
};

interface MessageItem { id: string; content: string; createdAt: string; sender?: { name: string } }

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Falha ao carregar as mensagens");
  return response.json() as Promise<{ messages?: MessageItem[]; data?: MessageItem[] }>;
};

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { booking, isLoading } = useBooking(id);

  if (isLoading) return <div className="mx-auto max-w-3xl space-y-4"><Skeleton className="h-8 w-1/3" /><Skeleton className="h-48 w-full rounded-xl" /></div>;
  if (!booking) return <div className="py-16 text-center"><p className="text-gray-500">Contratação não encontrada</p><Button variant="secondary" className="mt-4" onClick={() => router.back()}>Voltar</Button></div>;

  const eventDate = new Date(booking.event.date);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div><Link href="/dashboard/client/bookings" className="text-sm text-brand-600 hover:text-brand-700">← Voltar</Link><h1 className="mt-1 text-2xl font-bold text-gray-900">{booking.event.title}</h1><p className="text-sm text-gray-600">{eventDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p></div>
        <Badge color={statusColors[booking.status] ?? "gray"}>{statusLabels[booking.status] ?? booking.status}</Badge>
      </div>

      <Card><CardBody className="flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gray-100">{booking.musician.photoUrl ? <img src={booking.musician.photoUrl} alt="" className="h-full w-full object-cover" /> : <span className="text-2xl">🎵</span>}</div><div className="flex-1"><div className="flex items-center gap-2"><h2 className="font-semibold text-gray-900">{booking.musician.stageName}</h2>{booking.musician.verified && <Badge color="green">Verificado</Badge>}</div><Link href={`/musicians/${booking.musician.id}`} className="text-sm text-brand-600 hover:text-brand-700">Ver perfil</Link></div></CardBody></Card>

      <Card><CardHeader><h2 className="font-semibold text-gray-900">Detalhes do evento</h2></CardHeader><CardBody className="space-y-3"><DetailRow label="Tipo" value={booking.event.type} /><DetailRow label="Endereço" value={booking.event.addressLabel ?? "Não informado"} />{booking.value != null && <DetailRow label="Valor" value={`R$ ${booking.value.toFixed(2)}`} />}{booking.event.notes && <div><p className="text-xs text-gray-500">Observações</p><p className="mt-1 text-sm text-gray-700">{booking.event.notes}</p></div>}</CardBody></Card>

      {booking.payment && <Card><CardHeader><h2 className="font-semibold text-gray-900">Pagamento</h2></CardHeader><CardBody className="space-y-3"><DetailRow label="Status" value={<Badge color={booking.payment.status === "RELEASED" ? "green" : "yellow"}>{booking.payment.status}</Badge>} /><DetailRow label="Valor" value={`R$ ${booking.payment.amount.toFixed(2)}`} /><DetailRow label="Taxa da plataforma" value={`R$ ${booking.payment.platformFee.toFixed(2)}`} /></CardBody></Card>}

      {booking.status === "ACCEPTED" && !booking.payment && <Card><CardBody className="text-center"><p className="mb-4 text-sm text-gray-600">O músico aceitou sua solicitação. Confirme o pagamento para garantir a contratação.</p><Link href={`/dashboard/client/bookings/${booking.id}/pay`}><Button size="lg">Pagar R$ {booking.value?.toFixed(2) ?? "—"}</Button></Link></CardBody></Card>}
      {booking.status === "COMPLETED" && <Card><CardBody className="text-center"><p className="mb-4 text-sm text-gray-600">Como foi sua experiência? Avalie o músico.</p><Link href={`/dashboard/client/bookings/${booking.id}/review`}><Button size="lg">⭐ Avaliar</Button></Link></CardBody></Card>}

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

  return <div className="space-y-3"><div className="max-h-64 space-y-2 overflow-y-auto">{messages.length === 0 ? <p className="py-4 text-center text-sm text-gray-400">Nenhuma mensagem ainda. Inicie a conversa!</p> : messages.map((message) => <div key={message.id} className="rounded-lg bg-gray-50 p-2"><p className="mb-0.5 text-xs text-gray-400">{new Date(message.createdAt).toLocaleString("pt-BR")}</p><p className="text-sm text-gray-700">{message.content}</p></div>)}</div><form onSubmit={handleSend} className="flex gap-2"><input type="text" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Digite uma mensagem..." className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500" /><Button type="submit" size="sm" loading={sending}>Enviar</Button></form></div>;
}