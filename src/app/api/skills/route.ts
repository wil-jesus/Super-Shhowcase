import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const skills = await prisma.skill.findMany({
    where: { active: true },
    select: { id: true, name: true, slug: true, category: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: skills });
}