import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Admin marca a taxa como paga após receber do músico.
export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const result = await prisma.feeCharge.updateMany({
    where: { id: params.id, status: "PENDING" },
    data: { status: "PAID", paidAt: new Date() },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Taxa não encontrada ou já paga" }, { status: 404 });
  }

  return NextResponse.json({ charge: await prisma.feeCharge.findUnique({ where: { id: params.id } }) });
}
