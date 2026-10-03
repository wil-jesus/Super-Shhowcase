import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const verificationStatuses = ["APPROVED", "REJECTED"] as const;

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Validation error" }, { status: 400 });
  const input = body as Record<string, unknown>;
  if (typeof input.status !== "string" || !verificationStatuses.includes(input.status as (typeof verificationStatuses)[number]) || (input.notes !== undefined && (typeof input.notes !== "string" || input.notes.length > 1000))) {
    return NextResponse.json({ error: "Validation error" }, { status: 400 });
  }

  const verification = await prisma.verification.findUnique({
    where: { id: params.id },
    include: { musician: true },
  });
  if (!verification) return NextResponse.json({ error: "Verification not found" }, { status: 404 });

  const status = input.status as (typeof verificationStatuses)[number];
  await prisma.$transaction([
    prisma.verification.update({ where: { id: params.id }, data: { status } }),
    prisma.musician.update({ where: { id: verification.musicianId }, data: { verified: status === "APPROVED" } }),
  ]);

  const notes = typeof input.notes === "string" ? input.notes.trim() : "";
  await prisma.notification.create({
    data: {
      userId: verification.musician.userId,
      type: "VERIFICATION_RESULT",
      title: status === "APPROVED" ? "Verificação aprovada!" : "Verificação rejeitada",
      body: status === "APPROVED" ? "Seu perfil foi verificado. Agora você tem o selo de verificado." : `Sua verificação foi rejeitada. ${notes}`,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "ADMIN_REVIEW_VERIFICATION",
      entity: "Verification",
      entityId: params.id,
      details: JSON.stringify({ status, ...(notes ? { notes } : {}) }),
    },
  });

  return NextResponse.json({ id: params.id, status });
}
