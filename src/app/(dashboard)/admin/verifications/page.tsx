"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

interface Verification {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  documentUrl: string | null;
  musician: {
    id: string;
    stageName: string;
    photoUrl: string | null;
    verified: boolean;
    user: { id: string; name: string; email: string };
  };
}

interface VerificationsResponse {
  data: Verification[];
}

const fetcher = async (url: string): Promise<VerificationsResponse> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Não foi possível carregar as verificações");
  return response.json();
};

async function reviewVerification(id: string, status: "APPROVED" | "REJECTED") {
  const response = await fetch(`/api/admin/verifications/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Não foi possível revisar a verificação");
  }
}

export default function AdminVerificationsPage() {
  const [actionError, setActionError] = useState("");
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const { data, error, isLoading, mutate } = useSWR<VerificationsResponse>(
    "/api/admin/verifications?status=PENDING",
    fetcher,
  );

  const verifications = data?.data ?? [];

  const handleReview = async (id: string, status: "APPROVED" | "REJECTED") => {
    setActionError("");
    setReviewingId(id);
    try {
      await reviewVerification(id, status);
      await mutate();
    } catch (reviewError) {
      setActionError(
        reviewError instanceof Error ? reviewError.message : "Não foi possível revisar a verificação",
      );
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-brand-600 hover:text-brand-700">
          Voltar ao painel
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Verificações pendentes</h1>
        <p className="text-sm text-gray-600">Aprove ou rejeite verificações de músicos</p>
      </div>

      {(error || actionError) && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{error?.message ?? actionError}</p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
      ) : verifications.length === 0 ? (
        <div className="py-16 text-center">
          <div className="mb-2 text-4xl">✅</div>
          <p className="text-sm text-gray-500">Nenhuma verificação pendente</p>
        </div>
      ) : (
        <div className="space-y-4">
          {verifications.map((verification) => (
            <Card key={verification.id}>
              <CardBody className="flex flex-col items-start gap-4 sm:flex-row">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-2xl">
                  {verification.musician.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={verification.musician.photoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    "🎵"
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-gray-900">{verification.musician.stageName}</h2>
                    <Badge color="yellow">Pendente</Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    {verification.musician.user.name} · {verification.musician.user.email}
                  </p>
                  {verification.documentUrl && (
                    <a
                      href={verification.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-sm text-brand-600 hover:text-brand-700"
                    >
                      Ver documento →
                    </a>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="danger"
                    loading={reviewingId === verification.id}
                    onClick={() => handleReview(verification.id, "REJECTED")}
                  >
                    Rejeitar
                  </Button>
                  <Button
                    size="sm"
                    loading={reviewingId === verification.id}
                    onClick={() => handleReview(verification.id, "APPROVED")}
                  >
                    Aprovar
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
