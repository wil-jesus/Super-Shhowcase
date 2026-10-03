import { Prisma, Role, UserStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "20") || 20));
  const role = searchParams.get("role");
  const status = searchParams.get("status");
  const search = searchParams.get("q");
  const where: Prisma.UserWhereInput = {
    ...(role && Object.values(Role).includes(role as Role) ? { role: role as Role } : {}),
    ...(status && Object.values(UserStatus).includes(status as UserStatus) ? { status: status as UserStatus } : {}),
    ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { email: { contains: search, mode: "insensitive" as const } }] } : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, select: { id: true, name: true, email: true, role: true, status: true, emailVerified: true, phone: true, createdAt: true, musician: { select: { id: true, stageName: true, verified: true } }, client: { select: { id: true } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
    prisma.user.count({ where }),
  ]);
  return NextResponse.json({ data: users, total, page, limit });
}
