"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useBookings } from "@/lib/hooks/use-bookings";
import { formatBRL, formatEventDate } from "@/lib/event-format";
import { BOOKING_STATUS_COLORS as STATUS_COLORS, BOOKING_STATUS_LABELS as STATUS_LABELS } from "@/lib/booking-status";

export default function ClientBookingsPage() {
  const { bookings, isLoading, isError } = useBookings(1, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Minhas contratações</h1>
        <p className="text-sm text-gray-600">Acompanhe as solicitações feitas aos músicos</p>
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
            <p className="text-sm text-red-700">Não foi possível carregar suas contratações. Tente novamente.</p>
          </CardBody>
        </Card>
      ) : bookings.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center">
            <p className="text-sm font-medium text-gray-700">Nenhuma contratação ainda</p>
            <p className="mt-1 text-xs text-gray-400">Encontre um músico e envie sua primeira solicitação</p>
            <Link href="/search">
              <Button size="sm" className="mt-3">Buscar músicos</Button>
            </Link>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <Card key={booking.id}>
              <CardBody className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-gray-100">
                    {booking.musician.photoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={booking.musician.photoUrl} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium text-gray-900">{booking.musician.stageName}</p>
                      <Badge color={STATUS_COLORS[booking.status] ?? "gray"}>
                        {STATUS_LABELS[booking.status] ?? booking.status}
                      </Badge>
                    </div>
                    <p className="truncate text-sm text-gray-600">{booking.event.title}</p>
                    <p className="text-xs text-gray-500">
                      {formatEventDate(booking.event.date)} ·{" "}
                      {booking.value != null ? formatBRL(booking.value) : "Valor a combinar"}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/dashboard/client/bookings/${booking.id}`}
                  className="text-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  Ver detalhes
                </Link>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
