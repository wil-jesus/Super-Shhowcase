import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const status = new URL(req.url).searchParams.get("status") ?? "OPEN";
  const reports = await prisma.report.findMany({ where: { status }, include: { reporter: { select: { id: true, name: true, email: true } }, reported: { select: { id: true, name: true, email: true, role: true } } }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ data: reports });
}
