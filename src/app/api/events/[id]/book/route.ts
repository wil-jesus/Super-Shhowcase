import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "CLIENT" && session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const input = body && typeof body === "object" ? body as Record<string, unknown> : {};
  if (typeof input.musicianId !== "string" || (input.value !== undefined && (typeof input.value !== "number" || !Number.isFinite(input.value) || input.value < 0))) {
    return NextResponse.json({ error: "Validation error" }, { status: 400 });
  }

  const event = await prisma.event.findUnique({ where: { id: params.id }, include: { bookings: true } });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  if (event.status !== "OPEN") return NextResponse.json({ error: "Event is not open" }, { status: 409 });

  const musician = await prisma.musician.findUnique({ where: { id: input.musicianId }, include: { availability: true } });
  if (!musician) return NextResponse.json({ error: "Musician not found" }, { status: 404 });

  const eventEnd = new Date(event.date.getTime() + event.durationHours * 3600 * 1000);
  const conflict = musician.availability.some((slot) => slot.blocked && slot.startAt < eventEnd && slot.endAt > event.date);
  if (conflict) return NextResponse.json({ error: "Musician unavailable on this date/time" }, { status: 409 });

  const existingBooking = event.bookings.find((booking) => booking.musicianId === input.musicianId && booking.status !== "REJECTED" && booking.status !== "CANCELLED");
  if (existingBooking) return NextResponse.json({ error: "Booking already exists for this musician" }, { status: 409 });

  const booking = await prisma.booking.create({
    data: { clientId: event.clientId, eventId: event.id, musicianId: input.musicianId, value: input.value as number | undefined, status: "REQUESTED" },
    include: { musician: { select: { id: true, stageName: true, userId: true } }, event: { select: { id: true, title: true, date: true } } },
  });

  await notifyUser({ userId: booking.musician.userId, type: "NEW_REQUEST", title: "Nova solicitação de contratação", body: `Você recebeu uma solicitação para o evento "${booking.event.title}"`, bookingId: booking.id });
  return NextResponse.json(booking, { status: 201 });
}
