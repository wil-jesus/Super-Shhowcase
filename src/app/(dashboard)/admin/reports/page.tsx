"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

type ReportStatus = "OPEN" | "RESOLVED" | "DISMISSED";

interface Report {
  id: string;
  reason: string;
  status: ReportStatus;
  createdAt: string;
  reporter: { id: string; name: string; email: string };
  reported: { id: string; name: string; email: string; role: string };
}

interface ReportsResponse {
  data: Report[];
}

const statuses: { value: ReportStatus; label: string }[] = [
  { value: "OPEN", label: "Em aberto" },
  { value: "RESOLVED", label: "Resolvidas" },
  { value: "DISMISSED", label: "Arquivadas" },
];

const fetcher = async (url: string): Promise<ReportsResponse> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Não foi possível carregar as denúncias");
  return response.json();
};

async function updateReport(id: string, status: Exclude<ReportStatus, "OPEN">) {
  const response = await fetch(`/api/admin/reports/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Não foi possível atualizar a denúncia");
  }
}

function statusLabel(status: ReportStatus) {
  return statuses.find((item) => item.value === status)?.label ?? status;
}

export default function AdminReportsPage() {
  const [status, setStatus] = useState<ReportStatus>("OPEN");
  const [actionError, setActionError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { data, error, isLoading, mutate } = useSWR<ReportsResponse>(
    `/api/admin/reports?status=${status}`,
    fetcher,
  );

  const reports = data?.data ?? [];

  const handleResolve = async (id: string, nextStatus: Exclude<ReportStatus, "OPEN">) => {
    setActionError("");
    setUpdatingId(id);
    try {
      await updateReport(id, nextStatus);
      await mutate();
    } catch (updateError) {
      setActionError(
        updateError instanceof Error ? updateError.message : "Não foi possível atualizar a denúncia",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-brand-600 hover:text-brand-700">
          Voltar ao painel
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Denúncias</h1>
        <p className="text-sm text-gray-600">Gerencie denúncias de usuários</p>
      </div>

      {(error || actionError) && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{error?.message ?? actionError}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {statuses.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setStatus(item.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              status === item.value
                ? "bg-brand-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="py-16 text-center">
          <div className="mb-2 text-4xl">📋</div>
          <p className="text-sm text-gray-500">
            Nenhuma denúncia {status === "OPEN" ? "em aberto" : "neste filtro"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardBody>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Motivo: {report.reason}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Denunciante: {report.reporter.name} ({report.reporter.email})
                    </p>
                    <p className="text-xs text-gray-500">
                      Denunciado: {report.reported.name} ({report.reported.role})
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(report.createdAt).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <Badge
                    color={report.status === "OPEN" ? "red" : report.status === "RESOLVED" ? "green" : "gray"}
                  >
                    {statusLabel(report.status)}
                  </Badge>
                </div>
                {report.status === "OPEN" && (
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={updatingId === report.id}
                      onClick={() => handleResolve(report.id, "DISMISSED")}
                    >
                      Arquivar
                    </Button>
                    <Button
                      size="sm"
                      loading={updatingId === report.id}
                      onClick={() => handleResolve(report.id, "RESOLVED")}
                    >
                      Resolver
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}