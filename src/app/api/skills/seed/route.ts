import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });
  }

  const skills: Prisma.SkillCreateInput[] = [
    {
      name: "Piano",
      slug: "piano",
      category: "INSTRUMENT",
      synonyms: ["pianista", "teclado", "piano acústico"],
    },
    {
      name: "Bateria",
      slug: "bateria",
      category: "INSTRUMENT",
      synonyms: ["baterista", "drum", "drums"],
    },
    {
      name: "Violão",
      slug: "violao",
      category: "INSTRUMENT",
      synonyms: ["violonista", "guitarra acústica"],
    },
    {
      name: "Guitarra",
      slug: "guitarra",
      category: "INSTRUMENT",
      synonyms: ["guitarrista", "guitar"],
    },
    {
      name: "Baixo",
      slug: "baixo",
      category: "INSTRUMENT",
      synonyms: ["baixista", "bass"],
    },
    {
      name: "Saxofone",
      slug: "saxofone",
      category: "INSTRUMENT",
      synonyms: ["saxofonista", "sax"],
    },
    {
      name: "Trompete",
      slug: "trompete",
      category: "INSTRUMENT",
      synonyms: ["trompetista", "trumpet"],
    },
    {
      name: "Violino",
      slug: "violino",
      category: "INSTRUMENT",
      synonyms: ["violinista", "violin"],
    },
    {
      name: "Cello",
      slug: "cello",
      category: "INSTRUMENT",
      synonyms: ["violoncelo", "violoncelista"],
    },
    {
      name: "Percussão",
      slug: "percussao",
      category: "INSTRUMENT",
      synonyms: ["percussionista", "percussion"],
    },
    {
      name: "Voz",
      slug: "voz",
      category: "VOCAL",
      synonyms: ["cantor", "cantora", "vocalista", "singer"],
    },
    {
      name: "Backing Vocal",
      slug: "backing-vocal",
      category: "VOCAL",
      synonyms: ["backing", "coro", "vocal de apoio"],
    },
    {
      name: "DJ",
      slug: "dj",
      category: "FUNCTION",
      synonyms: ["disc jockey", "dj set"],
    },
    {
      name: "Compositor",
      slug: "compositor",
      category: "FUNCTION",
      synonyms: ["composição", "songwriter"],
    },
  ];

  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { slug: skill.slug },
      update: {},
      create: skill,
    });
  }

  return NextResponse.json({ message: `${skills.length} habilidades criadas` });
}