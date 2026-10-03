import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/roles";

function isSkillIds(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((skillId) => typeof skillId === "string" && skillId.length > 0)
  );
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const denied = await requireRole(["MUSICIAN", "ADMIN"]);
  if (denied) return denied;

  try {
    const { skillIds } = await req.json();

    if (!isSkillIds(skillIds)) {
      return NextResponse.json(
        { error: "skillIds deve ser uma lista não vazia" },
        { status: 400 }
      );
    }

    await prisma.musicianSkill.createMany({
      data: skillIds.map((skillId) => ({ musicianId: params.id, skillId })),
      skipDuplicates: true,
    });

    return NextResponse.json({ message: "Habilidades adicionadas" }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const denied = await requireRole(["MUSICIAN", "ADMIN"]);
  if (denied) return denied;

  try {
    const { skillIds } = await req.json();

    if (!isSkillIds(skillIds)) {
      return NextResponse.json(
        { error: "skillIds deve ser uma lista não vazia" },
        { status: 400 }
      );
    }

    await prisma.musicianSkill.deleteMany({
      where: {
        musicianId: params.id,
        skillId: { in: skillIds },
      },
    });

    return NextResponse.json({ message: "Habilidades removidas" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}