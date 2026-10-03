import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeMusicianReputation } from "@/lib/reputation";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const musician = await prisma.musician.findUnique({
    where: { id: params.id },
    select: { userId: true },
  });

  if (!musician) {
    return NextResponse.json({ error: "Músico não encontrado" }, { status: 404 });
  }

  const reviews = await prisma.review.findMany({
    where: { revieweeId: musician.userId, type: "CLIENT_TO_MUSICIAN" },
    include: {
      reviewer: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const reputation = await computeMusicianReputation(params.id);

  return NextResponse.json({
    reviews,
    reputation,
  });
}