import { EventType } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const eventTypes = Object.values(EventType);
const eventStatuses = ["OPEN", "BOOKED", "CLOSED", "CANCELLED"] as const;

function isValidDate(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(new Date(value).getTime());
}

function parseEventBody(body: Record<string, unknown>) {
  const { title, type = "OTHER", date, durationHours = 4, locationLat, locationLng, addressLabel, notes, budget } = body;
  if (
    typeof title !== "string" || title.trim().length < 3 || title.length > 120 ||
    typeof type !== "string" || !eventTypes.includes(type as EventType) ||
    !isValidDate(date) || new Date(date) <= new Date() ||
    typeof durationHours !== "number" || !Number.isFinite(durationHours) || durationHours < 1 || durationHours > 24 ||
    typeof locationLat !== "number" || !Number.isFinite(locationLat) || locationLat < -90 || locationLat > 90 ||
    typeof locationLng !== "number" || !Number.isFinite(locationLng) || locationLng < -180 || locationLng > 180 ||
    (addressLabel !== undefined && addressLabel !== null && (typeof addressLabel !== "string" || addressLabel.length > 300)) ||
    (notes !== undefined && notes !== null && (typeof notes !== "string" || notes.length > 2000)) ||
    (budget !== undefined && budget !== null && (typeof budget !== "number" || !Number.isFinite(budget) || budget < 0))
  ) return null;

  return {
    title: title.trim(),
    type: type as EventType,
    date: new Date(date),
    durationHours,
    locationLat,
    locationLng,
    addressLabel: typeof addressLabel === "string" ? addressLabel.trim() || null : null,
    notes: typeof notes === "string" ? notes.trim() || null : null,
    budget: budget as number | undefined,
  };
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "CLIENT" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const data = body && typeof body === "object" ? parseEventBody(body as Record<string, unknown>) : null;
  if (!data) return NextResponse.json({ error: "Validation error" }, { status: 400 });

  const client = await prisma.client.findUnique({ where: { userId: session.user.id } });
  if (!client) return NextResponse.json({ error: "Client profile not found" }, { status: 404 });

  const event = await prisma.event.create({ data: { ...data, clientId: client.id } });
  return NextResponse.json(event, { status: 201 });
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "20") || 20));
  const status = searchParams.get("status");
  if (status && !eventStatuses.includes(status as (typeof eventStatuses)[number])) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const client = await prisma.client.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  const where = { ...(client ? { clientId: client.id } : {}), ...(status ? { status } : {}) };
  const [events, total] = await Promise.all([
    prisma.event.findMany({ where, include: { bookings: { select: { id: true, status: true, musician: { select: { stageName: true, photoUrl: true } } } } }, orderBy: { date: "desc" }, skip: (page - 1) * limit, take: limit }),
    prisma.event.count({ where }),
  ]);

  return NextResponse.json({ data: events, total, page, limit });
}
