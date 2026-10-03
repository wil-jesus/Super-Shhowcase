"use client";

import Link from "next/link";
import useSWR from "swr";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

interface AdminMetrics {
  users?: {
    total?: number;
    musicians?: number;
    clients?: number;
    newLast30Days?: number;
  };
  bookings?: {
    total?: number;
    pending?: number;
    completed?: number;
    disputed?: number;
  };
  payments?: {
    totalRevenue?: number;
    releasedCount?: number;
  };
  moderation?: {
    pendingVerifications?: number;
    openReports?: number;
  };
}

const fetcher = async (url: string): Promise<AdminMetrics> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Não foi possível carregar as métricas");
  return response.json();
};

export default function AdminDashboard() {
  const { data, error, isLoading } = useSWR<AdminMetrics>("/api/admin/metrics", fetcher);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
        <p className="text-sm text-red-700">{error.message}</p>
      </div>
    );
  }

  const metrics = data ?? {};

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Painel administrativo</h1>
        <p className="text-sm text-gray-600">Visão geral da plataforma</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon="👥"
          label="Usuários"
          value={metrics.users?.total ?? 0}
          sub={`${metrics.users?.newLast30Days ?? 0} novos (30d)`}
        />
        <StatCard
          icon="🎵"
          label="Músicos"
          value={metrics.users?.musicians ?? 0}
          sub={`${metrics.users?.clients ?? 0} clientes`}
        />
        <StatCard
          icon="📅"
          label="Bookings"
          value={metrics.bookings?.total ?? 0}
          sub={`${metrics.bookings?.pending ?? 0} pendentes`}
        />
        <StatCard
          icon="💰"
          label="Receita"
          value={`R$ ${(metrics.payments?.totalRevenue ?? 0).toFixed(0)}`}
          sub={`${metrics.payments?.releasedCount ?? 0} pagamentos liberados`}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Moderação</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            <ModerationRow
              label="Verificações pendentes"
              count={metrics.moderation?.pendingVerifications ?? 0}
              href="/admin/verifications"
            />
            <ModerationRow
              label="Denúncias em aberto"
              count={metrics.moderation?.openReports ?? 0}
              href="/admin/reports"
            />
            <ModerationRow
              label="Bookings em disputa"
              count={metrics.bookings?.disputed ?? 0}
              href="/admin/bookings"
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Resumo de bookings</h2>
          </CardHeader>
          <CardBody className="space-y-2">
            <SummaryRow label="Pendentes" count={metrics.bookings?.pending ?? 0} color="yellow" />
            <SummaryRow label="Concluídos" count={metrics.bookings?.completed ?? 0} color="green" />
            <SummaryRow label="Em disputa" count={metrics.bookings?.disputed ?? 0} color="red" />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: string;
  label: string;
  value: string | number;
  sub: string;
}) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-400">{sub}</p>
      </CardBody>
    </Card>
  );
}

function ModerationRow({ label, count, href }: { label: string; count: number; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-lg border border-gray-100 p-3 transition-colors hover:border-brand-200 hover:bg-brand-50/50"
    >
      <span className="text-sm text-gray-700">{label}</span>
      <Badge color={count > 0 ? "red" : "green"}>{count}</Badge>
    </Link>
  );
}

function SummaryRow({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: "yellow" | "green" | "red";
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <Badge color={color}>{count}</Badge>
    </div>
  );
}
