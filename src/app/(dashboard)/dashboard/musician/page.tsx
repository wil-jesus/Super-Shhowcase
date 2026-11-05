"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

interface MusicianSummary {
  stageName: string;
  verified: boolean;
}

export default function MusicianDashboardPage() {
  const [musician, setMusician] = useState<MusicianSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/musicians/me");
        if (!response.ok) throw new Error("Falha ao carregar perfil");
        setMusician(await response.json());
      } catch {
        setError("Não foi possível carregar o seu perfil");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Meu painel</h1>
        <Link href="/dashboard/musician/profile" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Editar perfil
        </Link>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3"><p className="text-sm text-red-700">{error}</p></div>}

      <Card>
        <CardHeader><h2 className="font-semibold text-gray-900">Seu perfil</h2></CardHeader>
        <CardBody className="space-y-3">
          {loading ? (
            <Skeleton className="h-12 w-full" />
          ) : musician ? (
            <>
              <div>
                <p className="text-xs text-gray-500">Nome artístico</p>
                <p className="text-lg font-medium text-gray-900">{musician.stageName}</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-gray-500">Status do perfil</p>
                <Badge color={musician.verified ? "green" : "yellow"}>{musician.verified ? "Verificado" : "Aguardando verificação"}</Badge>
              </div>
            </>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}
