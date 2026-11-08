import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const statusParam = new URL(req.url).searchParams.get("status");
  const where: Prisma.FeeChargeWhereInput =
    statusParam === "PENDING" || statusParam === "PAID" ? { status: statusParam } : {};

  const [charges, pending, paid] = await Promise.all([
    prisma.feeCharge.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        musician: { select: { id: true, stageName: true } },
        booking: { select: { id: true, value: true, feeRate: true, event: { select: { title: true } } } },
      },
    }),
    prisma.feeCharge.aggregate({ where: { status: "PENDING" }, _sum: { amount: true } }),
    prisma.feeCharge.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
  ]);

  return NextResponse.json({
    charges,
    totals: { pending: Number(pending._sum.amount ?? 0), paid: Number(paid._sum.amount ?? 0) },
  });
}
