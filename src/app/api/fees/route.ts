import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Financeiro do músico: taxas da plataforma devidas e já pagas.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const musician = await prisma.musician.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!musician) return NextResponse.json({ error: "Perfil de músico não encontrado" }, { status: 403 });

  const charges = await prisma.feeCharge.findMany({
    where: { musicianId: musician.id },
    orderBy: { createdAt: "desc" },
    include: {
      booking: {
        select: { id: true, value: true, netAmount: true, feeRate: true, event: { select: { title: true, date: true } } },
      },
    },
  });

  const sum = (status: "PENDING" | "PAID") =>
    charges.filter((charge) => charge.status === status).reduce((total, charge) => total + Number(charge.amount), 0);

  return NextResponse.json({ charges, totals: { pending: sum("PENDING"), paid: sum("PAID") } });
}
