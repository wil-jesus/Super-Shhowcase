"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useEvents } from "@/lib/hooks/use-events";
import {
  EVENT_STATUS_COLORS,
  EVENT_STATUS_LABELS,
  EVENT_TYPE_LABELS,
  formatBRL,
  formatEventDate,
} from "@/lib/event-format";

const PAGE_SIZE = 20;

export default function ClientEventsPage() {
  const [page, setPage] = useState(1);
  const { events, total, isLoading, isError } = useEvents(page, PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meus eventos</h1>
          <p className="text-sm text-gray-600">
            {total} {total === 1 ? "evento" : "eventos"}
          </p>
        </div>
        <Link href="/dashboard/client/events/new">
          <Button>Criar evento</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardBody>
            <p className="text-sm text-red-700">Não foi possível carregar seus eventos. Tente novamente.</p>
          </CardBody>
        </Card>
      ) : events.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center">
            <p className="text-sm font-medium text-gray-700">Nenhum evento ainda</p>
            <p className="mt-1 text-xs text-gray-400">Crie seu primeiro evento para contratar músicos</p>
            <Link href="/dashboard/client/events/new">
              <Button size="sm" className="mt-3">Criar evento</Button>
            </Link>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <Card key={event.id}>
              <CardBody className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-gray-900">{event.title}</p>
                    <Badge color={EVENT_STATUS_COLORS[event.status] ?? "gray"}>
                      {EVENT_STATUS_LABELS[event.status] ?? event.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{formatEventDate(event.date)}</p>
                  <p className="text-xs text-gray-500">
                    {EVENT_TYPE_LABELS[event.type] ?? event.type}
                    {event.budget != null && ` · ${formatBRL(event.budget)}`}
                    {event.bookings && event.bookings.length > 0 && ` · ${event.bookings.length} solicitação(ões)`}
                  </p>
                </div>
                <Link
                  href={`/dashboard/client/events/${event.id}`}
                  className="text-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  Ver detalhes
                </Link>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
            Anterior
          </Button>
          <span className="text-sm text-gray-600">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
}
