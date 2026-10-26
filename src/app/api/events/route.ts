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

const isNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

function parseEventBody(body: Record<string, unknown>) {
  const { title, type = "OTHER", date, durationHours = 4, locationLat, locationLng, addressLabel, notes, budget } = body;
  const fields: Record<string, string> = {};

  if (typeof title !== "string" || title.trim().length < 3 || title.length > 120) fields.title = "O título deve ter entre 3 e 120 caracteres.";
  if (typeof type !== "string" || !eventTypes.includes(type as EventType)) fields.type = "Tipo de evento inválido.";
  if (!isValidDate(date)) fields.date = "Informe uma data e hora válidas.";
  else if (new Date(date) <= new Date()) fields.date = "A data do evento deve ser no futuro.";
  if (!isNumber(durationHours) || durationHours < 1 || durationHours > 24) fields.durationHours = "A duração deve ser um número entre 1 e 24 horas.";
  if (!isNumber(locationLat) || locationLat < -90 || locationLat > 90) fields.locationLat = "Latitude inválida: use um número entre -90 e 90.";
  if (!isNumber(locationLng) || locationLng < -180 || locationLng > 180) fields.locationLng = "Longitude inválida: use um número entre -180 e 180.";
  if (addressLabel !== undefined && addressLabel !== null && (typeof addressLabel !== "string" || addressLabel.length > 300)) fields.addressLabel = "O endereço deve ter no máximo 300 caracteres.";
  if (notes !== undefined && notes !== null && (typeof notes !== "string" || notes.length > 2000)) fields.notes = "As observações devem ter no máximo 2000 caracteres.";
  if (budget !== undefined && budget !== null && (!isNumber(budget) || budget < 0)) fields.budget = "O orçamento deve ser um número maior ou igual a zero.";

  if (Object.keys(fields).length > 0) return { fields };

  return {
    data: {
      title: (title as string).trim(),
      type: type as EventType,
      date: new Date(date as string),
      durationHours: durationHours as number,
      locationLat: locationLat as number,
      locationLng: locationLng as number,
      addressLabel: typeof addressLabel === "string" ? addressLabel.trim() || null : null,
      notes: typeof notes === "string" ? notes.trim() || null : null,
      budget: budget as number | undefined,
    },
  };
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "CLIENT" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  const parsed = parseEventBody(body as Record<string, unknown>);
  if (!parsed.data) {
    return NextResponse.json({ error: Object.values(parsed.fields).join(" "), fields: parsed.fields }, { status: 400 });
  }

  const client = await prisma.client.findUnique({ where: { userId: session.user.id } });
  if (!client) return NextResponse.json({ error: "Client profile not found" }, { status: 404 });

  const event = await prisma.event.create({ data: { ...parsed.data, clientId: client.id } });
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
