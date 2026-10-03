export type MatchFactors = {
  skillScore: number;
  distanceScore: number;
  ratingScore: number;
  reviewCountScore: number;
  availabilityScore: number;
  priceScore: number;
  verificationScore: number;
};

export const DEFAULT_WEIGHTS = {
  skill: 0.3,
  distance: 0.2,
  rating: 0.2,
  reviewCount: 0.1,
  availability: 0.1,
  price: 0.05,
  verification: 0.05,
};

export function calculateMatchScore(
  factors: MatchFactors,
  weights: typeof DEFAULT_WEIGHTS
): number {
  return (
    factors.skillScore * weights.skill +
    factors.distanceScore * weights.distance +
    factors.ratingScore * weights.rating +
    factors.reviewCountScore * weights.reviewCount +
    factors.availabilityScore * weights.availability +
    factors.priceScore * weights.price +
    factors.verificationScore * weights.verification
  );
}