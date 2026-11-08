"use client";

import { useState } from "react";
import useSWR from "swr";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatBRL } from "@/lib/event-format";

interface AdminFee {
  id: string;
  amount: string | number;
  status: "PENDING" | "PAID";
  createdAt: string;
  musician: { id: string; stageName: string };
  booking: { id: string; value: string | number | null; feeRate: string | number; event: { title: string } } | null;
}

interface AdminFeesResponse {
  charges: AdminFee[];
  totals: { pending: number; paid: number };
}

const fetcher = async (url: string): Promise<AdminFeesResponse> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Não foi possível carregar as taxas");
  return response.json();
};

export default function AdminFeesPage() {
  const { data, error, isLoading, mutate } = useSWR("/api/admin/fees", fetcher);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  const markPaid = async (id: string) => {
    if (!window.confirm("Marcar esta taxa como paga?")) return;
    setBusyId(id);
    setActionError("");
    try {
      const response = await fetch(`/api/admin/fees/${id}`, { method: "PATCH" });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Falha ao atualizar a taxa");
      }
      await mutate();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Falha ao atualizar a taxa");
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (error || !data) return <p role="alert" className="text-sm text-red-700">{error?.message ?? "Erro ao carregar"}</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Taxas</h1>
        <p className="text-sm text-gray-600">Take rate devido pelos músicos</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card><CardBody><p className="text-2xl font-bold text-gray-900">{formatBRL(data.totals.pending)}</p><p className="text-xs text-gray-500">A receber</p></CardBody></Card>
        <Card><CardBody><p className="text-2xl font-bold text-gray-900">{formatBRL(data.totals.paid)}</p><p className="text-xs text-gray-500">Recebido</p></CardBody></Card>
      </div>

      {actionError && <p role="alert" className="text-sm text-red-600">{actionError}</p>}

      <Card>
        <CardHeader><h2 className="font-semibold text-gray-900">Cobranças</h2></CardHeader>
        <CardBody className="space-y-3">
          {data.charges.length === 0 && <p className="text-sm text-gray-400">Nenhuma taxa registrada.</p>}
          {data.charges.map((charge) => (
            <div key={charge.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-100 p-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{charge.musician.stageName}</p>
                <p className="text-xs text-gray-500">
                  {charge.booking?.event.title ?? "—"}
                  {charge.booking?.value != null && ` · ${formatBRL(charge.booking.value)} a ${Number(charge.booking.feeRate)}%`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-900">{formatBRL(charge.amount)}</span>
                <Badge color={charge.status === "PAID" ? "green" : "yellow"}>{charge.status === "PAID" ? "Paga" : "Pendente"}</Badge>
                {charge.status === "PENDING" && <Button size="sm" loading={busyId === charge.id} onClick={() => markPaid(charge.id)}>Marcar paga</Button>}
              </div>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
