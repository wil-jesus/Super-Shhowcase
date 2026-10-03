"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

const statusColors: Record<string, "gray" | "green" | "yellow" | "red"> = {
  ACTIVE: "green",
  PENDING_VERIFICATION: "yellow",
  SUSPENDED: "yellow",
  BLOCKED: "red",
};

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  musician?: { id: string; stageName: string; verified: boolean } | null;
}

interface UsersResponse {
  data: AdminUser[];
  total: number;
  page: number;
  limit: number;
}

const fetcher = async (url: string): Promise<UsersResponse> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Não foi possível carregar os usuários");
  return response.json();
};

async function updateUserStatus(userId: string, status: string) {
  const response = await fetch(`/api/admin/users/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Não foi possível atualizar o usuário");
  }
}

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [actionError, setActionError] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const query = new URLSearchParams({ page: String(page), limit: "20" });
  if (search.trim()) query.set("q", search.trim());
  const { data, error, isLoading, mutate } = useSWR<UsersResponse>(
    `/api/admin/users?${query.toString()}`,
    fetcher,
  );

  const users = data?.data ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.limit ?? 20)));

  const handleAction = async (userId: string, status: string) => {
    setActionError("");
    setUpdatingUserId(userId);
    try {
      await updateUserStatus(userId, status);
      await mutate();
    } catch (actionException) {
      setActionError(
        actionException instanceof Error ? actionException.message : "Não foi possível atualizar o usuário",
      );
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-brand-600 hover:text-brand-700">
          Voltar ao painel
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Usuários</h1>
        <p className="text-sm text-gray-600">Gerenciar contas da plataforma</p>
      </div>

      <input
        type="search"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(1);
        }}
        placeholder="Buscar por nome ou e-mail..."
        aria-label="Buscar usuários"
        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
      />

      {(error || actionError) && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{error?.message ?? actionError}</p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-20" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">Nenhum usuário encontrado</p>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <Card key={user.id}>
              <CardBody className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-medium">
                    {user.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge color="blue">{user.role}</Badge>
                      <Badge color={statusColors[user.status] ?? "gray"}>{user.status}</Badge>
                      {user.musician?.verified && <Badge color="green">Verificado</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  {user.status === "ACTIVE" && (
                    <Button
                      size="sm"
                      variant="danger"
                      loading={updatingUserId === user.id}
                      onClick={() => handleAction(user.id, "SUSPENDED")}
                    >
                      Suspender
                    </Button>
                  )}
                  {user.status === "SUSPENDED" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={updatingUserId === user.id}
                      onClick={() => handleAction(user.id, "ACTIVE")}
                    >
                      Reativar
                    </Button>
                  )}
                  {user.status !== "BLOCKED" && (
                    <Button
                      size="sm"
                      variant="danger"
                      loading={updatingUserId === user.id}
                      onClick={() => handleAction(user.id, "BLOCKED")}
                    >
                      Bloquear
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <div className="flex items-center justify-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
          disabled={page === 1 || isLoading}
        >
          Anterior
        </Button>
        <span className="text-sm text-gray-500">
          Página {page} de {totalPages}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
          disabled={page >= totalPages || isLoading}
        >
          Próxima
        </Button>
      </div>
    </div>
  );
}
