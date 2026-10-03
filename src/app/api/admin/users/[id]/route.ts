import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const roles = ["CLIENT", "MUSICIAN", "ADMIN"] as const;
const statuses = ["PENDING_VERIFICATION", "ACTIVE", "SUSPENDED", "BLOCKED"] as const;

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Validation error" }, { status: 400 });
  const input = body as Record<string, unknown>;
  if (input.status === undefined && input.role === undefined) return NextResponse.json({ error: "No changes provided" }, { status: 400 });
  if (input.status !== undefined && (typeof input.status !== "string" || !statuses.includes(input.status as (typeof statuses)[number]))) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  if (input.role !== undefined && (typeof input.role !== "string" || !roles.includes(input.role as (typeof roles)[number]))) return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  if (params.id === session.user.id && input.status === "BLOCKED") return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const data = { ...(input.status !== undefined ? { status: input.status as (typeof statuses)[number] } : {}), ...(input.role !== undefined ? { role: input.role as (typeof roles)[number] } : {}) };
  const updated = await prisma.user.update({ where: { id: params.id }, data, select: { id: true, name: true, email: true, role: true, status: true } });
  await prisma.adminAction.create({ data: { adminId: session.user.id, targetUserId: params.id, action: (input.status ?? input.role ?? "MODERATE") as string, details: JSON.stringify(input) } });
  await prisma.auditLog.create({ data: { actorId: session.user.id, action: "ADMIN_UPDATE_USER", entity: "User", entityId: params.id, details: JSON.stringify(input) } });
  return NextResponse.json(updated);
}
