import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalize, tokenize } from "@/lib/search";
import { haversineDistanceKm } from "@/lib/geo";
import { calculateMatchScore, DEFAULT_WEIGHTS } from "@/lib/matching";

function finiteNumber(value: string | null): number | null {
  if (value === null || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim() || "";
  const date = searchParams.get("date");
  const latitude = finiteNumber(searchParams.get("lat"));
  const longitude = finiteNumber(searchParams.get("lng"));
  const radius = finiteNumber(searchParams.get("radius"));
  const maxPrice = finiteNumber(searchParams.get("maxPrice"));
  const minRating = finiteNumber(searchParams.get("minRating"));
  const requestedLimit = finiteNumber(searchParams.get("limit"));
  const requestedOffset = finiteNumber(searchParams.get("offset"));
  const limit = Math.min(Math.max(Math.floor(requestedLimit ?? 20), 1), 50);
  const offset = Math.max(Math.floor(requestedOffset ?? 0), 0);

  if (!query) {
    return NextResponse.json({ error: "Parâmetro 'q' obrigatório" }, { status: 400 });
  }

  if (
    (latitude !== null && (latitude < -90 || latitude > 90)) ||
    (longitude !== null && (longitude < -180 || longitude > 180)) ||
    (radius !== null && radius <= 0) ||
    (maxPrice !== null && maxPrice < 0) ||
    (minRating !== null && (minRating < 0 || minRating > 5))
  ) {
    return NextResponse.json({ error: "Filtros inválidos" }, { status: 400 });
  }

  const tokens = tokenize(query);
  const allSkills = await prisma.skill.findMany({ where: { active: true } });
  const matchedSkillIds = new Set<string>();
  const matchedSkills: { name: string; exact: boolean }[] = [];

  for (const skill of allSkills) {
    const skillName = normalize(skill.name);
    const synonyms = skill.synonyms.map(normalize);
    let matched = false;
    let exact = false;

    for (const token of tokens) {
      const tokenExact = skillName === token || synonyms.some((synonym) => synonym === token);
      const tokenFuzzy = skillName.includes(token) || synonyms.some((synonym) => synonym.includes(token));
      matched ||= tokenExact || tokenFuzzy;
      exact ||= tokenExact;
    }

    if (matched) {
      matchedSkillIds.add(skill.id);
      matchedSkills.push({ name: skill.name, exact });
    }
  }

  if (matchedSkillIds.size === 0) {
    return NextResponse.json({ query, matchedSkills: [], total: 0, limit, offset, results: [] });
  }

  const musicians = await prisma.musician.findMany({
    where: {
      skills: { some: { skillId: { in: [...matchedSkillIds] } } },
      ...(maxPrice !== null ? { priceMin: { lte: maxPrice } } : {}),
    },
    include: {
      skills: { include: { skill: { select: { name: true } } } },
      user: { select: { reviewsReceived: { select: { rating: true } } } },
      availability: true,
    },
  });

  const eventDate = date ? new Date(date) : null;
  if (eventDate && Number.isNaN(eventDate.getTime())) {
    return NextResponse.json({ error: "Data inválida" }, { status: 400 });
  }

  const results = musicians
    .filter((musician) => {
      if (!eventDate) return true;
      const eventEnd = new Date(eventDate.getTime() + 3 * 60 * 60 * 1000);
      return !musician.availability.some(
        (availability) => availability.blocked && availability.startAt < eventEnd && availability.endAt > eventDate
      );
    })
    .map((musician) => {
      const ratings = musician.user.reviewsReceived.map((review) => review.rating);
      const avgRating = ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0;
      let distanceKm: number | null = null;
      let distanceScore = 0.5;

      if (latitude !== null && longitude !== null && musician.latitude !== null && musician.longitude !== null) {
        distanceKm = haversineDistanceKm(latitude, longitude, musician.latitude, musician.longitude);
        const effectiveRadius = radius ?? musician.serviceRadiusKm;
        distanceScore = Math.max(0, 1 - distanceKm / effectiveRadius);
      }

      const priceScore = maxPrice !== null && musician.priceMax !== null
        ? musician.priceMax <= maxPrice ? 1 : 0
        : 0.5;
      const result = {
        id: musician.id,
        stageName: musician.stageName,
        photoUrl: musician.photoUrl,
        avgRating: Number(avgRating.toFixed(1)),
        reviewCount: ratings.length,
        verified: musician.verified,
        priceMin: musician.priceMin,
        priceMax: musician.priceMax,
        distanceKm: distanceKm === null ? null : Number(distanceKm.toFixed(1)),
        matchScore: calculateMatchScore(
          {
            skillScore: 1,
            distanceScore,
            ratingScore: avgRating / 5,
            reviewCountScore: Math.min(1, ratings.length / 50),
            availabilityScore: eventDate ? 1 : 0.5,
            priceScore,
            verificationScore: musician.verified ? 1 : 0,
          },
          DEFAULT_WEIGHTS
        ),
        skills: musician.skills.map(({ skill }) => skill.name),
      };

      return result;
    })
    .filter((musician) => minRating === null || musician.avgRating >= minRating)
    .sort((first, second) =>
      second.matchScore - first.matchScore ||
      (first.distanceKm ?? 9999) - (second.distanceKm ?? 9999) ||
      second.avgRating - first.avgRating ||
      second.reviewCount - first.reviewCount
    );

  return NextResponse.json({
    query,
    matchedSkills,
    total: results.length,
    limit,
    offset,
    results: results.slice(offset, offset + limit),
  });
}