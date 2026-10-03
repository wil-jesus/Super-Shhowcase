import { EventType } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const eventTypes = Object.values(EventType);
const eventStatuses = ["OPEN", "BOOKED", "CLOSED", "CANCELLED"] as const;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      bookings: { include: { musician: { select: { id: true, stageName: true, photoUrl: true, verified: true } } } },
      client: { select: { id: true, user: { select: { name: true } } } },
    },
  });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  return NextResponse.json(event);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "CLIENT" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Validation error" }, { status: 400 });
  const input = body as Record<string, unknown>;
  const data: Record<string, unknown> = {};

  if (input.title !== undefined) {
    if (typeof input.title !== "string" || input.title.trim().length < 3 || input.title.length > 120) return NextResponse.json({ error: "Invalid title" }, { status: 400 });
    data.title = input.title.trim();
  }
  if (input.type !== undefined) {
    if (typeof input.type !== "string" || !eventTypes.includes(input.type as EventType)) return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    data.type = input.type;
  }
  if (input.date !== undefined) {
    if (typeof input.date !== "string" || Number.isNaN(new Date(input.date).getTime())) return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    data.date = new Date(input.date);
  }
  const durationHours = input.durationHours;
  const locationLat = input.locationLat;
  const locationLng = input.locationLng;
  const budget = input.budget;
  if (durationHours !== undefined && (typeof durationHours !== "number" || !Number.isFinite(durationHours) || durationHours < 1 || durationHours > 24)) return NextResponse.json({ error: "Invalid durationHours" }, { status: 400 });
  if (locationLat !== undefined && (typeof locationLat !== "number" || !Number.isFinite(locationLat) || locationLat < -90 || locationLat > 90)) return NextResponse.json({ error: "Invalid locationLat" }, { status: 400 });
  if (locationLng !== undefined && (typeof locationLng !== "number" || !Number.isFinite(locationLng) || locationLng < -180 || locationLng > 180)) return NextResponse.json({ error: "Invalid locationLng" }, { status: 400 });
  if (budget !== undefined && (typeof budget !== "number" || !Number.isFinite(budget) || budget < 0)) return NextResponse.json({ error: "Invalid budget" }, { status: 400 });
  if (durationHours !== undefined) data.durationHours = durationHours;
  if (locationLat !== undefined) data.locationLat = locationLat;
  if (locationLng !== undefined) data.locationLng = locationLng;
  if (budget !== undefined) data.budget = budget;
  for (const field of ["addressLabel", "notes"] as const) if (input[field] !== undefined) {
    if (input[field] !== null && typeof input[field] !== "string") return NextResponse.json({ error: `Invalid ${field}` }, { status: 400 });
    data[field] = typeof input[field] === "string" ? input[field].trim() || null : null;
  }
  if (input.status !== undefined) {
    if (typeof input.status !== "string" || !eventStatuses.includes(input.status as (typeof eventStatuses)[number])) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    data.status = input.status;
  }

  const existing = await prisma.event.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  if (existing.status === "BOOKED" && data.status !== "CANCELLED") return NextResponse.json({ error: "Cannot edit a booked event" }, { status: 409 });

  const updated = await prisma.event.update({ where: { id: params.id }, data });
  return NextResponse.json(updated);
}
