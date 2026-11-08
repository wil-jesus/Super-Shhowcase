"use client";

import Link from "next/link";
import useSWR from "swr";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatBRL } from "@/lib/event-format";

interface FeeItem {
  id: string;
  amount: string | number;
  status: "PENDING" | "PAID";
  createdAt: string;
  paidAt: string | null;
  booking: { id: string; value: string | number | null; netAmount: string | number; feeRate: string | number; event: { title: string } } | null;
}

interface FeesResponse {
  charges: FeeItem[];
  totals: { pending: number; paid: number };
}

const fetcher = async (url: string): Promise<FeesResponse> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Não foi possível carregar o financeiro");
  return response.json();
};

export default function MusicianFinancePage() {
  const { data, error, isLoading } = useSWR("/api/fees", fetcher);

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (error || !data) return <p role="alert" className="text-sm text-red-700">{error?.message ?? "Erro ao carregar"}</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
        <p className="text-sm text-gray-600">Taxas da plataforma sobre contratações pagas diretamente pelo cliente</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card><CardBody><p className="text-2xl font-bold text-gray-900">{formatBRL(data.totals.pending)}</p><p className="text-xs text-gray-500">Taxas a pagar</p></CardBody></Card>
        <Card><CardBody><p className="text-2xl font-bold text-gray-900">{formatBRL(data.totals.paid)}</p><p className="text-xs text-gray-500">Taxas pagas</p></CardBody></Card>
      </div>

      <Card>
        <CardHeader><h2 className="font-semibold text-gray-900">Cobranças</h2></CardHeader>
        <CardBody className="space-y-3">
          {data.charges.length === 0 && <p className="text-sm text-gray-400">Nenhuma taxa até o momento.</p>}
          {data.charges.map((charge) => (
            <div key={charge.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
              <div>
                {charge.booking ? (
                  <Link href={`/dashboard/musician/bookings/${charge.booking.id}`} className="text-sm font-medium text-brand-600 hover:text-brand-700">{charge.booking.event.title}</Link>
                ) : <span className="text-sm text-gray-700">Contratação removida</span>}
                {charge.booking?.value != null && <p className="text-xs text-gray-500">Valor {formatBRL(charge.booking.value)} · taxa {Number(charge.booking.feeRate)}% · líquido {formatBRL(charge.booking.netAmount)}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-900">{formatBRL(charge.amount)}</span>
                <Badge color={charge.status === "PAID" ? "green" : "yellow"}>{charge.status === "PAID" ? "Paga" : "Pendente"}</Badge>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
