import { BookingStatus, EventType, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const eventTypes = Object.values(EventType);

function isBookingStatus(value: string): value is BookingStatus {
  return Object.values(BookingStatus).includes(value as BookingStatus);
}

function isConflict(error: unknown, code: string) {
  return error instanceof Error && error.message === code;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (session.user.role !== "CLIENT" && session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Apenas clientes podem solicitar contratação" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const {
      musicianId,
      eventTitle,
      eventType = "OTHER",
      eventDate,
      durationHours = 3,
      locationLat,
      locationLng,
      addressLabel,
      notes,
      value,
    } = body;

    if (
      typeof musicianId !== "string" ||
      typeof eventTitle !== "string" ||
      !eventTitle.trim() ||
      typeof eventDate !== "string" ||
      typeof locationLat !== "number" ||
      typeof locationLng !== "number"
    ) {
      return NextResponse.json({ error: "Dados da contratação inválidos" }, { status: 400 });
    }

    const parsedDate = new Date(eventDate);
    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate <= new Date() ||
      !Number.isFinite(durationHours) ||
      typeof durationHours !== "number" ||
      !Number.isFinite(durationHours) ||
      durationHours < 1 ||
      durationHours > 24 ||
      !Number.isFinite(locationLat) ||
      locationLat < -90 ||
      locationLat > 90 ||
      !Number.isFinite(locationLng) ||
      locationLng < -180 ||
      locationLng > 180
    ) {
      return NextResponse.json({ error: "Data, duração ou localização inválida" }, { status: 400 });
    }

    if (!eventTypes.includes(eventType)) {
      return NextResponse.json({ error: "Tipo de evento inválido" }, { status: 400 });
    }

    if (value != null && (typeof value !== "number" || !Number.isFinite(value) || value < 0)) {
      return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
    }

    const client = await prisma.client.findUnique({ where: { userId: session.user.id } });
    const musician = await prisma.musician.findUnique({
      where: { id: musicianId },
      select: { id: true },
    });

    if (!client) {
      return NextResponse.json({ error: "Perfil de cliente não encontrado" }, { status: 404 });
    }

    if (!musician) {
      return NextResponse.json({ error: "Músico não encontrado" }, { status: 404 });
    }

    const end = new Date(parsedDate.getTime() + durationHours * 60 * 60 * 1000);
    const booking = await prisma.$transaction(async (tx) => {
      const activeBookings = await tx.booking.findMany({
        where: {
          musicianId,
          status: { in: ["ACCEPTED", "CONFIRMED", "IN_PROGRESS"] },
        },
        select: { event: { select: { date: true, durationHours: true } } },
      });

      const hasEventConflict = activeBookings.some((activeBooking) => {
        const activeEnd = new Date(
          activeBooking.event.date.getTime() + activeBooking.event.durationHours * 60 * 60 * 1000
        );
        return activeBooking.event.date < end && activeEnd > parsedDate;
      });
      if (hasEventConflict) throw new Error("CONFLICT_EVENT");

      const blocked = await tx.availability.findFirst({
        where: {
          musicianId,
          blocked: true,
          startAt: { lt: end },
          endAt: { gt: parsedDate },
        },
      });
      if (blocked) throw new Error("CONFLICT_BLOCKED");

      const event = await tx.event.create({
        data: {
          clientId: client.id,
          title: eventTitle.trim(),
          type: eventType,
          date: parsedDate,
          durationHours,
          locationLat,
          locationLng,
          addressLabel: typeof addressLabel === "string" ? addressLabel.trim() || null : null,
          notes: typeof notes === "string" ? notes.trim() || null : null,
          budget: value,
        },
      });

      return tx.booking.create({
        data: {
          clientId: client.id,
          eventId: event.id,
          musicianId,
          value,
          status: "REQUESTED",
        },
      });
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    if (isConflict(error, "CONFLICT_EVENT")) {
      return NextResponse.json(
        { error: "O músico já possui evento nesse horário" },
        { status: 409 }
      );
    }

    if (isConflict(error, "CONFLICT_BLOCKED")) {
      return NextResponse.json(
        { error: "O músico está indisponível nessa data" },
        { status: 409 }
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Contratação duplicada" }, { status: 409 });
    }

    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const requestedRole = searchParams.get("role");
  const where: Prisma.BookingWhereInput = {};

  if (status) {
    if (!isBookingStatus(status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }
    where.status = status;
  }

  if (requestedRole === "admin" && session.user.role === "ADMIN") {
    // Administradores podem consultar todas as contratações.
  } else if (requestedRole === "musician" || session.user.role === "MUSICIAN") {
    const musician = await prisma.musician.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!musician) return NextResponse.json({ bookings: [] });
    where.musicianId = musician.id;
  } else {
    const client = await prisma.client.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!client) return NextResponse.json({ bookings: [] });
    where.clientId = client.id;
  }

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      musician: { select: { id: true, stageName: true, photoUrl: true, verified: true } },
      event: { select: { id: true, title: true, date: true, type: true, addressLabel: true } },
      client: { select: { user: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ bookings });
}