

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getMusician(userId: string) {
  return prisma.musician.findUnique({
    where: { userId },
    include: {
      skills: { select: { id: true, skill: { select: { id: true, name: true } } } },
      genres: { select: { id: true, genre: { select: { id: true, name: true } } } },
    },
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const musician = await getMusician(session.user.id);
  if (!musician) return NextResponse.json({ error: "Perfil de músico não encontrado" }, { status: 404 });

  return NextResponse.json({
    ...musician,
    skills: musician.skills.map(({ skill }) => skill),
    genres: musician.genres.map(({ genre }) => genre),
  });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const musician = await prisma.musician.findUnique({ where: { userId: session.user.id } });
  if (!musician) return NextResponse.json({ error: "Perfil de músico não encontrado" }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const stageName = input.stageName;
  const bio = input.bio;
  const photoUrl = input.photoUrl;
  const priceMin = input.priceMin;
  const priceMax = input.priceMax;
  const serviceRadiusKm = input.serviceRadiusKm;
  const latitude = input.latitude;
  const longitude = input.longitude;
  const skills = input.skills;
  // NOVO: gêneros — se não vier no body, vira lista vazia (não quebra clientes antigos)
  const genres = Array.isArray(input.genres) ? input.genres : [];

  if (
    typeof stageName !== "string" ||
    !stageName.trim() ||
    stageName.length > 120 ||
    (bio !== null && typeof bio !== "string") ||
    (photoUrl !== null && typeof photoUrl !== "string") ||
    (priceMin !== null && typeof priceMin !== "number") ||
    (priceMax !== null && typeof priceMax !== "number") ||
    typeof serviceRadiusKm !== "number" ||
    (latitude !== null && typeof latitude !== "number") ||
    (longitude !== null && typeof longitude !== "number") ||
    !Array.isArray(skills) ||
    skills.some((skillId) => typeof skillId !== "string") ||
    genres.some((genreId) => typeof genreId !== "string")
  ) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  if (
    (priceMin !== null && (!Number.isFinite(priceMin) || priceMin < 0)) ||
    (priceMax !== null && (!Number.isFinite(priceMax) || priceMax < 0)) ||
    (priceMin !== null && priceMax !== null && priceMin > priceMax) ||
    !Number.isFinite(serviceRadiusKm) ||
    serviceRadiusKm < 1 ||
    serviceRadiusKm > 500
  ) {
    return NextResponse.json({ error: "Valores de preço ou raio inválidos" }, { status: 400 });
  }

  const skillIds = [...new Set(skills as string[])];
  const validSkills = await prisma.skill.findMany({
    where: { id: { in: skillIds }, active: true },
    select: { id: true },
  });
  if (validSkills.length !== skillIds.length) {
    return NextResponse.json({ error: "Habilidade inválida" }, { status: 400 });
  }

  const genreIds = [...new Set(genres as string[])];
  // CORRIGIDO: o modelo Genre não tem campo `active` — valida só pelos IDs
  const validGenres = await prisma.genre.findMany({
    where: { id: { in: genreIds } },
    select: { id: true },
  });
  if (validGenres.length !== genreIds.length) {
    return NextResponse.json({ error: "Gênero inválido" }, { status: 400 });
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.musician.update({
      where: { id: musician.id },
      data: {
        stageName: stageName.trim(),
        bio: typeof bio === "string" ? bio.trim() || null : null,
        photoUrl: typeof photoUrl === "string" ? photoUrl.trim() || null : null,
        priceMin,
        priceMax,
        serviceRadiusKm,
        latitude,
        longitude,
      },
    });
    await transaction.musicianSkill.deleteMany({ where: { musicianId: musician.id } });
    if (skillIds.length > 0) {
      await transaction.musicianSkill.createMany({
        data: skillIds.map((skillId) => ({ musicianId: musician.id, skillId })),
      });
    }
    // NOVO: substitui a lista de gêneros (mesmo padrão das skills)
    await transaction.musicianGenre.deleteMany({ where: { musicianId: musician.id } });
    if (genreIds.length > 0) {
      await transaction.musicianGenre.createMany({
        data: genreIds.map((genreId) => ({ musicianId: musician.id, genreId })),
      });
    }
  });

  return NextResponse.json({ musician: await getMusician(session.user.id) });
}