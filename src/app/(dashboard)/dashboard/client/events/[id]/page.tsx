"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useEvent } from "@/lib/hooks/use-events";
import {
  EVENT_STATUS_COLORS,
  EVENT_STATUS_LABELS,
  EVENT_TYPE_LABELS,
  formatBRL,
  formatEventDate,
  googleMapsUrl,
} from "@/lib/event-format";

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const { event, isLoading, isError } = useEvent(params.id);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Card>
          <CardBody className="py-10 text-center">
            <p className="text-sm font-medium text-gray-700">Evento não encontrado</p>
            <p className="mt-1 text-xs text-gray-400">Ele pode ter sido removido ou você não tem acesso.</p>
            <Link href="/dashboard/client/events" className="mt-3 inline-block text-sm text-brand-600 hover:text-brand-700">
              Voltar para meus eventos
            </Link>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/dashboard/client/events" className="text-sm text-brand-600 hover:text-brand-700">
        ← Meus eventos
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl font-bold text-gray-900">{event.title}</h1>
            <Badge color={EVENT_STATUS_COLORS[event.status] ?? "gray"}>
              {EVENT_STATUS_LABELS[event.status] ?? event.status}
            </Badge>
          </div>
        </CardHeader>
        <CardBody>
          <dl className="space-y-4 text-sm">
            <Row label="Tipo">{EVENT_TYPE_LABELS[event.type] ?? event.type}</Row>
            <Row label="Data e hora">{formatEventDate(event.date)} (horário de Brasília)</Row>
            <Row label="Duração">
              {event.durationHours.toLocaleString("pt-BR")} {event.durationHours === 1 ? "hora" : "horas"}
            </Row>
            <Row label="Endereço">{event.addressLabel || "Não informado"}</Row>
            <Row label="Coordenadas">
              <span className="font-mono">
                {event.locationLat.toFixed(6)}, {event.locationLng.toFixed(6)}
              </span>
              {" · "}
              <a
                href={googleMapsUrl(event.locationLat, event.locationLng)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 hover:text-brand-700"
              >
                Ver no Google Maps
              </a>
            </Row>
            <Row label="Orçamento">{event.budget != null ? formatBRL(event.budget) : "Não informado"}</Row>
            <Row label="Observações">
              {event.notes ? <span className="whitespace-pre-wrap">{event.notes}</span> : "Sem observações"}
            </Row>
          </dl>
        </CardBody>
      </Card>

      {event.bookings && event.bookings.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Solicitações</h2>
          </CardHeader>
          <CardBody className="space-y-2">
            {event.bookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/dashboard/client/bookings/${booking.id}`}
                className="flex items-center justify-between rounded-lg border border-gray-100 p-3 text-sm hover:border-brand-200 hover:bg-brand-50/50"
              >
                <span className="font-medium text-gray-900">{booking.musician.stageName}</span>
                <Badge>{booking.status}</Badge>
              </Link>
            ))}
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <dt className="text-gray-500">{label}</dt>
      <dd className="col-span-2 text-gray-900">{children}</dd>
    </div>
  );
}
