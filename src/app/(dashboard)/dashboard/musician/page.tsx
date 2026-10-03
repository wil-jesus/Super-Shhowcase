"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { updateBookingStatus, useBookings } from "@/lib/hooks/use-bookings";

const bookingStatusColors: Record<
  string,
  "gray" | "green" | "yellow" | "red" | "blue" | "purple"
> = {
  REQUESTED: "yellow",
  ACCEPTED: "blue",
  REJECTED: "red",
  CONFIRMED: "green",
  IN_PROGRESS: "purple",
  COMPLETED: "green",
  DISPUTED: "red",
};

export default function MusicianDashboard() {
  const { bookings, isLoading, mutate } = useBookings(1, 10);
  const pendingRequests = bookings.filter((booking) => booking.status === "REQUESTED");
  const activeBookings = bookings.filter((booking) => ["ACCEPTED", "CONFIRMED", "IN_PROGRESS"].includes(booking.status));
  const completedBookings = bookings.filter((booking) => booking.status === "COMPLETED");

  const handleStatus = async (id: string, status: "ACCEPTED" | "REJECTED") => {
    await updateBookingStatus(id, status);
    await mutate();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Painel do músico</h1>
          <p className="text-sm text-gray-600">Solicitações, agenda e repasses</p>
        </div>
        <Link href="/dashboard/musician/profile"><Button variant="secondary">Editar perfil</Button></Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon="⏳" value={pendingRequests.length} label="Novas solicitações" />
        <StatCard icon="📅" value={activeBookings.length} label="Contratações ativas" />
        <StatCard icon="🎉" value={completedBookings.length} label="Eventos concluídos" />
        <StatCard icon="💰" value={`R$ ${completedBookings.reduce((sum, booking) => sum + (booking.value ?? 0), 0).toFixed(0)}`} label="Total ganho" />
      </div>

      <Card>
        <CardHeader><h2 className="font-semibold text-gray-900">Solicitações pendentes</h2></CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 2 }).map((_, index) => <Skeleton key={index} className="h-20 w-full" />)}</div>
          ) : pendingRequests.length === 0 ? (
            <div className="py-8 text-center"><div className="mb-2 text-3xl">📭</div><p className="text-sm text-gray-500">Nenhuma solicitação pendente</p></div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((booking) => (
                <div key={booking.id} className="flex flex-col justify-between gap-3 rounded-lg border border-gray-100 p-4 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">🎵</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{booking.event.title}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(booking.event.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" })}
                        {booking.event.addressLabel && ` · ${booking.event.addressLabel}`}
                      </p>
                      {booking.value != null && <p className="mt-1 text-sm font-medium text-brand-600">R$ {booking.value.toFixed(0)}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="danger" onClick={() => handleStatus(booking.id, "REJECTED")}>Recusar</Button>
                    <Button size="sm" onClick={() => handleStatus(booking.id, "ACCEPTED")}>Aceitar</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader><h2 className="font-semibold text-gray-900">Próximos eventos</h2></CardHeader>
        <CardBody>
          {activeBookings.length === 0 ? <p className="text-sm text-gray-400">Nenhum evento próximo</p> : (
            <div className="space-y-3">
              {activeBookings.map((booking) => (
                <Link key={booking.id} href={`/dashboard/musician/bookings/${booking.id}`} className="block rounded-lg border border-gray-100 p-3 transition-colors hover:border-brand-200">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm font-medium text-gray-900">{booking.event.title}</p><p className="text-xs text-gray-500">{new Date(booking.event.date).toLocaleDateString("pt-BR")}</p></div>
                    <Badge color={bookingStatusColors[booking.status] ?? "gray"}>{booking.status}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: string; value: number | string; label: string }) {
  return <Card><CardBody className="flex items-center gap-3"><span className="text-2xl">{icon}</span><div><p className="text-2xl font-bold text-gray-900">{value}</p><p className="text-xs text-gray-500">{label}</p></div></CardBody></Card>;
}