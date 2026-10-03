import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const payment = await prisma.payment.findUnique({
    where: { id: params.id },
    include: {
      booking: {
        select: {
          client: { select: { userId: true } },
          musician: { select: { userId: true } },
        },
      },
    },
  });

  if (!payment) {
    return NextResponse.json({ error: "Pagamento não encontrado" }, { status: 404 });
  }

  const isClient = payment.booking.client.userId === session.user.id;
  const isMusician = payment.booking.musician.userId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isClient && !isMusician && !isAdmin) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  return NextResponse.json({
    id: payment.id,
    amount: payment.amount,
    platformFee: payment.platformFee,
    status: payment.status,
    createdAt: payment.createdAt,
  });
}