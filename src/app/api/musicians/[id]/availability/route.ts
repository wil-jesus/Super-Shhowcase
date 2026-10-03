import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function authorizeMusician(musicianId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { response: NextResponse.json({ error: "Não autenticado" }, { status: 401 }) };
  }

  const musician = await prisma.musician.findUnique({
    where: { id: musicianId },
    select: { userId: true },
  });
  if (!musician) {
    return { response: NextResponse.json({ error: "Músico não encontrado" }, { status: 404 }) };
  }

  const isOwner = musician.userId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return { response: NextResponse.json({ error: "Sem permissão" }, { status: 403 }) };
  }

  return { session, musician };
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const availability = await prisma.availability.findMany({
    where: { musicianId: params.id },
    orderBy: { startAt: "asc" },
  });

  return NextResponse.json({ availability });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const authorization = await authorizeMusician(params.id);
  if (authorization.response) return authorization.response;

  try {
    const body = await req.json();
    const { startAt, endAt, blocked = false } = body;

    if (typeof startAt !== "string" || typeof endAt !== "string") {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const start = new Date(startAt);
    const end = new Date(endAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return NextResponse.json({ error: "endAt deve ser maior que startAt" }, { status: 400 });
    }

    if (typeof blocked !== "boolean") {
      return NextResponse.json({ error: "blocked deve ser booleano" }, { status: 400 });
    }

    const activeBookings = await prisma.booking.findMany({
      where: {
        musicianId: params.id,
        status: { in: ["ACCEPTED", "CONFIRMED", "IN_PROGRESS"] },
      },
      select: { event: { select: { date: true, durationHours: true } } },
    });
    const hasBookingConflict = activeBookings.some((booking) => {
      const bookingStart = new Date(booking.event.date);
      const bookingEnd = new Date(
        bookingStart.getTime() + booking.event.durationHours * 60 * 60 * 1000
      );
      return bookingStart < end && bookingEnd > start;
    });

    if (hasBookingConflict) {
      return NextResponse.json({ error: "Conflito com evento confirmado" }, { status: 409 });
    }

    const existingAvailability = await prisma.availability.findMany({
      where: { musicianId: params.id },
      select: { startAt: true, endAt: true },
    });
    const hasAvailabilityConflict = existingAvailability.some(
      (availability) => availability.startAt < end && availability.endAt > start
    );

    if (hasAvailabilityConflict) {
      return NextResponse.json({ error: "Já existe registro nesse período" }, { status: 409 });
    }

    const availability = await prisma.availability.create({
      data: { musicianId: params.id, startAt: start, endAt: end, blocked },
    });

    return NextResponse.json({ availability }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const authorization = await authorizeMusician(params.id);
  if (authorization.response) return authorization.response;

  try {
    const body = await req.json();
    const { availabilityId } = body;

    if (typeof availabilityId !== "string" || !availabilityId) {
      return NextResponse.json({ error: "availabilityId obrigatório" }, { status: 400 });
    }

    const availability = await prisma.availability.findFirst({
      where: { id: availabilityId, musicianId: params.id },
    });
    if (!availability) {
      return NextResponse.json({ error: "Registro não encontrado" }, { status: 404 });
    }

    await prisma.availability.delete({ where: { id: availabilityId } });
    return NextResponse.json({ message: "Disponibilidade removida" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}