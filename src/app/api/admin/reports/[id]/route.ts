import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const reportStatuses = ["RESOLVED", "DISMISSED"] as const;

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Validation error" }, { status: 400 });
  }

  const status = (body as Record<string, unknown>).status;
  if (typeof status !== "string" || !reportStatuses.includes(status as (typeof reportStatuses)[number])) {
    return NextResponse.json({ error: "Validation error" }, { status: 400 });
  }

  const report = await prisma.report.findUnique({ where: { id: params.id } });
  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

  await prisma.report.update({ where: { id: params.id }, data: { status } });
  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "ADMIN_REVIEW_REPORT",
      entity: "Report",
      entityId: params.id,
      details: { status },
    },
  });

  return NextResponse.json({ id: params.id, status });
}