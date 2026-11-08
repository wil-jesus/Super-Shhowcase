import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import {
  applyGeo,
  averageRating,
  MusicianSort,
  parseCsv,
  parseNumber,
  SearchItem,
  sortItems,
  toPublicItem,
} from "@/lib/musician-search";

const SORTS: MusicianSort[] = ["distance", "price_asc", "price_desc", "rating"];

function bad(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = await rateLimit(`musicians:${ip}`, 60, 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Muitas requisições" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const skill = searchParams.get("skill");
  const genre = searchParams.get("genre");
  const skillIds = parseCsv(searchParams.get("skillIds"));
  const genreIds = parseCsv(searchParams.get("genreIds"));

  const priceMin = parseNumber(searchParams.get("priceMin"));
  const priceMax = parseNumber(searchParams.get("priceMax"));
  const radiusKm = parseNumber(searchParams.get("radiusKm"));
  const lat = parseNumber(searchParams.get("lat"));
  const lng = parseNumber(searchParams.get("lng"));
  const minRating = parseNumber(searchParams.get("minRating"));
  const pageParam = parseNumber(searchParams.get("page"));
  const limitParam = parseNumber(searchParams.get("limit"));

  if ([priceMin, priceMax, radiusKm, lat, lng, minRating, pageParam, limitParam].includes("invalid")) {
    return bad("Parâmetro numérico inválido");
  }
  if ((lat === null) !== (lng === null)) return bad("lat e lng devem ser enviados juntos");
  if (lat !== null && (Math.abs(lat as number) > 90 || Math.abs(lng as number) > 180)) {
    return bad("Coordenadas inválidas");
  }
  if (radiusKm !== null && lat === null) return bad("radiusKm requer lat e lng");

  const sortParam = searchParams.get("sort");
  if (sortParam && !SORTS.includes(sortParam as MusicianSort)) return bad("sort inválido");
  if (sortParam === "distance" && lat === null) return bad("sort=distance requer lat e lng");

  const page = Math.max(1, Math.floor((pageParam as number | null) ?? 1));
  const pageSize = Math.min(50, Math.max(1, Math.floor((limitParam as number | null) ?? 20)));

  const and: Prisma.MusicianWhereInput[] = [];

  if (skillIds.length) and.push({ skills: { some: { skillId: { in: skillIds } } } });
  if (genreIds.length) and.push({ genres: { some: { genreId: { in: genreIds } } } });

  if (skill) {
    and.push({
      skills: {
        some: {
          skill: {
            OR: [
              { name: { contains: skill, mode: "insensitive" } },
              { synonyms: { has: skill } },
            ],
          },
        },
      },
    });
  }
  if (genre) {
    and.push({
      genres: { some: { genre: { name: { equals: genre, mode: "insensitive" } } } },
    });
  }
  if (priceMin !== null) and.push({ priceMin: { gte: priceMin as number } });
  if (priceMax !== null) and.push({ priceMax: { lte: priceMax as number } });

  try {
    const rows = await prisma.musician.findMany({
      where: and.length ? { AND: and } : {},
      select: {
        id: true,
        stageName: true,
        photoUrl: true,
        latitude: true,
        longitude: true,
        serviceRadiusKm: true,
        priceMin: true,
        priceMax: true,
        createdAt: true,
        skills: { select: { skill: { select: { id: true, name: true, category: true } } } },
        genres: { select: { genre: { select: { id: true, name: true } } } },
        user: { select: { reviewsReceived: { select: { rating: true } } } },
      },
    });

    let items: SearchItem[] = rows.map((m) => ({
      id: m.id,
      stageName: m.stageName,
      photoUrl: m.photoUrl,
      priceMin: m.priceMin === null ? null : Number(m.priceMin),
      priceMax: m.priceMax === null ? null : Number(m.priceMax),
      serviceRadiusKm: m.serviceRadiusKm,
      skills: m.skills.map((s) => s.skill),
      genres: m.genres.map((g) => g.genre),
      rating: averageRating(m.user?.reviewsReceived ?? []),
      distanceKm: null,
      createdAt: m.createdAt.getTime(),
      _lat: m.latitude === null ? null : Number(m.latitude),
      _lng: m.longitude === null ? null : Number(m.longitude),
    }));

    if (minRating !== null) {
      items = items.filter((i) => i.rating !== null && i.rating >= (minRating as number));
    }

    if (lat !== null) {
      items = applyGeo(
        items,
        { lat: lat as number, lng: lng as number },
        radiusKm as number | null
      );
    }

    const sorted = sortItems(items, (sortParam as MusicianSort | null) ?? null);
    const total = sorted.length;
    const musicians = sorted
      .slice((page - 1) * pageSize, page * pageSize)
      .map(toPublicItem);

    return NextResponse.json({ musicians, total, page, limit: pageSize });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
