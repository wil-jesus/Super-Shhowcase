import { prisma } from "@/lib/prisma";

const CONFIG = {
  recentWindowDays: 180,
  verifiedWeight: 1.2,
  minReviewsForTrust: 5,
  lowScoreThreshold: 2,
  burstWindowHours: 24,
  burstMax: 3,
};

export async function computeMusicianReputation(musicianId: string) {
  const musician = await prisma.musician.findUnique({
    where: { id: musicianId },
    select: { userId: true },
  });

  if (!musician) {
    return { avgRating: 0, reviewCount: 0, trustScore: 0, flags: ["MUSICIAN_NOT_FOUND"] };
  }

  const reviews = await prisma.review.findMany({
    where: { revieweeId: musician.userId, type: "CLIENT_TO_MUSICIAN" },
    include: { reviewer: { select: { id: true, emailVerified: true } } },
    orderBy: { createdAt: "asc" },
  });

  if (reviews.length === 0) {
    return { avgRating: 0, reviewCount: 0, trustScore: 0, flags: [] as string[] };
  }

  const flags: string[] = [];
  const now = Date.now();
  const burstWindowMs = CONFIG.burstWindowHours * 60 * 60 * 1000;
  const reviewerGroups = new Map<string, typeof reviews>();

  for (const review of reviews) {
    const group = reviewerGroups.get(review.reviewerId) ?? [];
    group.push(review);
    reviewerGroups.set(review.reviewerId, group);
  }

  for (const [reviewerId, reviewerReviews] of reviewerGroups) {
    for (let index = 0; index <= reviewerReviews.length - CONFIG.burstMax; index += 1) {
      const windowStart = reviewerReviews[index].createdAt.getTime();
      const windowEnd = reviewerReviews[index + CONFIG.burstMax - 1].createdAt.getTime();
      if (windowEnd - windowStart <= burstWindowMs) {
        flags.push(`BURST_RATINGS:${reviewerId}`);
        break;
      }
    }
  }

  const lowCount = reviews.filter((review) => review.rating <= CONFIG.lowScoreThreshold).length;
  const highCount = reviews.filter((review) => review.rating >= 4).length;
  if (lowCount / reviews.length > 0.6 && reviews.length >= CONFIG.minReviewsForTrust) {
    flags.push("LOW_RATING_CONCENTRATION");
  }
  if (highCount / reviews.length > 0.9 && reviews.length >= CONFIG.minReviewsForTrust) {
    flags.push("HIGH_RATING_CONCENTRATION");
  }

  const reviewerIds = reviews.map((review) => review.reviewerId);
  const reviewerReviewCounts = await prisma.review.groupBy({
    by: ["reviewerId"],
    where: { reviewerId: { in: reviewerIds } },
    _count: { _all: true },
  });
  const reviewCountByReviewer = new Map(
    reviewerReviewCounts.map((entry) => [entry.reviewerId, entry._count._all])
  );

  let weightedSum = 0;
  let weightTotal = 0;
  for (const review of reviews) {
    let weight = 1;
    const ageDays = (now - review.createdAt.getTime()) / (24 * 60 * 60 * 1000);
    if (ageDays <= CONFIG.recentWindowDays) {
      weight += (1 - Math.max(0, ageDays) / CONFIG.recentWindowDays) * 0.5;
    }
    if (review.reviewer.emailVerified) weight *= CONFIG.verifiedWeight;
    if ((reviewCountByReviewer.get(review.reviewerId) ?? 0) === 1) weight *= 0.8;

    weightedSum += review.rating * weight;
    weightTotal += weight;
  }

  const avgRating = weightTotal > 0 ? weightedSum / weightTotal : 0;
  return {
    avgRating: Math.round(avgRating * 10) / 10,
    reviewCount: reviews.length,
    trustScore: Math.min(100, Math.round((reviews.length / 20) * 100)),
    flags: [...new Set(flags)],
  };
}