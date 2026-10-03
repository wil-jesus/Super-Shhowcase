import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const verificationStatuses = ["PENDING", "APPROVED", "REJECTED"] as const;

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const requestedStatus = new URL(req.url).searchParams.get("status") ?? "PENDING";
  if (!verificationStatuses.includes(requestedStatus as (typeof verificationStatuses)[number])) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const verifications = await prisma.verification.findMany({
    where: { status: requestedStatus },
    include: {
      musician: {
        select: {
          id: true,
          stageName: true,
          photoUrl: true,
          verified: true,
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ data: verifications });
}
