import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const skill = searchParams.get("skill");
  const genre = searchParams.get("genre");
  const minRating = searchParams.get("minRating");

  const where: Prisma.MusicianWhereInput = {};

  if (skill) {
    where.skills = {
      some: {
        skill: {
          OR: [
            { name: { contains: skill, mode: "insensitive" } },
            { synonyms: { has: skill } },
          ],
        },
      },
    };
  }

  if (genre) {
    where.genres = {
      some: {
        genre: { name: { equals: genre, mode: "insensitive" } },
      },
    };
  }

  if (minRating) {
    const rating = Number(minRating);

    if (Number.isFinite(rating)) {
      where.user = {
        reviewsReceived: { some: { rating: { gte: rating } } },
      };
    }
  }

  try {
    const musicians = await prisma.musician.findMany({
      where,
      select: {
        id: true,
        stageName: true,
        bio: true,
        photoUrl: true,
        serviceRadiusKm: true,
        priceMin: true,
        priceMax: true,
        verified: true,
        skills: { include: { skill: true } },
        genres: { include: { genre: true } },
      },
    });

    return NextResponse.json({ musicians });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}