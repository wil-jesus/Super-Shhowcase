"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useEvents } from "@/lib/hooks/use-events";
import { useBookings } from "@/lib/hooks/use-bookings";

const eventStatusColors: Record<string, "gray" | "green" | "yellow" | "red" | "blue"> = {
  OPEN: "blue",
  BOOKED: "green",
  CLOSED: "gray",
  CANCELLED: "red",
};

const bookingStatusColors: Record<
  string,
  "gray" | "green" | "yellow" | "red" | "blue" | "purple"
> = {
  REQUESTED: "yellow",
  PENDING_MUSICIAN: "yellow",
  ACCEPTED: "blue",
  REJECTED: "red",
  CANCELLED: "red",
  CONFIRMED: "green",
  IN_PROGRESS: "purple",
  COMPLETED: "green",
  DISPUTED: "red",
};

export default function ClientDashboard() {
  const { events, isLoading: eventsLoading } = useEvents(1, 5);
  const { bookings, isLoading: bookingsLoading } = useBookings(1, 5);

  const upcomingBookings = bookings.filter(
    (booking) => !["COMPLETED", "CANCELLED", "REJECTED"].includes(booking.status),
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meus eventos</h1>
          <p className="text-sm text-gray-600">Gerencie seus eventos e contratações</p>
        </div>
        <Link href="/dashboard/client/events/new">
          <Button>Criar evento</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Eventos ativos" value={events.filter((event) => ["OPEN", "BOOKED"].includes(event.status)).length} icon="📅" />
        <StatCard label="Solicitações pendentes" value={bookings.filter((booking) => booking.status === "REQUESTED").length} icon="⏳" />
        <StatCard label="Confirmados" value={bookings.filter((booking) => booking.status === "CONFIRMED").length} icon="✅" />
        <StatCard label="Concluídos" value={bookings.filter((booking) => booking.status === "COMPLETED").length} icon="🎉" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Eventos recentes</h2>
              <Link href="/dashboard/client/events" className="text-sm text-brand-600 hover:text-brand-700">
                Ver todos
              </Link>
            </div>
          </CardHeader>
          <CardBody>
            {eventsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-16 w-full" />)}
              </div>
            ) : events.length === 0 ? (
              <EmptyState
                icon="📅"
                title="Nenhum evento ainda"
                desc="Crie seu primeiro evento para contratar músicos"
                action={<Link href="/dashboard/client/events/new"><Button size="sm" className="mt-2">Criar evento</Button></Link>}
              />
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <Link key={event.id} href={`/dashboard/client/events/${event.id}`} className="block rounded-lg border border-gray-100 p-3 transition-colors hover:border-brand-200 hover:bg-brand-50/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{event.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(event.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                          {" · "}{event.type}
                        </p>
                      </div>
                      <Badge color={eventStatusColors[event.status] ?? "gray"}>{event.status}</Badge>
                    </div>
                    {event.bookings && event.bookings.length > 0 && <p className="mt-1 text-xs text-gray-400">{event.bookings.length} solicitação(ões)</p>}
                  </Link>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Contratações ativas</h2>
              <Link href="/dashboard/client/bookings" className="text-sm text-brand-600 hover:text-brand-700">Ver todas</Link>
            </div>
          </CardHeader>
          <CardBody>
            {bookingsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-16 w-full" />)}
              </div>
            ) : upcomingBookings.length === 0 ? (
              <EmptyState icon="🎵" title="Sem contratações ativas" desc="Busque músicos e faça sua primeira contratação" />
            ) : (
              <div className="space-y-3">
                {upcomingBookings.slice(0, 5).map((booking) => (
                  <Link key={booking.id} href={`/dashboard/client/bookings/${booking.id}`} className="block rounded-lg border border-gray-100 p-3 transition-colors hover:border-brand-200 hover:bg-brand-50/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gray-100">
                          {booking.musician.photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={booking.musician.photoUrl} alt="" className="h-full w-full object-cover" />
                          ) : <span className="text-xs">🎵</span>}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{booking.musician.stageName}</p>
                          <p className="text-xs text-gray-500">{booking.event.title}</p>
                        </div>
                      </div>
                      <Badge color={bookingStatusColors[booking.status] ?? "gray"}>{booking.status}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return <Card><CardBody className="flex items-center gap-3"><span className="text-2xl">{icon}</span><div><p className="text-2xl font-bold text-gray-900">{value}</p><p className="text-xs text-gray-500">{label}</p></div></CardBody></Card>;
}

function EmptyState({ icon, title, desc, action }: { icon: string; title: string; desc: string; action?: React.ReactNode }) {
  return <div className="py-8 text-center"><div className="mb-2 text-3xl">{icon}</div><p className="text-sm font-medium text-gray-700">{title}</p><p className="mt-1 text-xs text-gray-400">{desc}</p>{action}</div>;
}