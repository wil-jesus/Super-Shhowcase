import { haversineDistanceKm } from "@/lib/geo";

export type MusicianSort = "distance" | "price_asc" | "price_desc" | "rating";

export interface SearchItem {
  id: string;
  stageName: string;
  photoUrl: string | null;
  priceMin: number | null;
  priceMax: number | null;
  serviceRadiusKm: number;
  skills: { id: string; name: string; category: string }[];
  genres: { id: string; name: string }[];
  rating: number | null;
  distanceKm: number | null;
  createdAt: number;
  /** Coordenadas apenas para cálculo interno; removidas por toPublicItem. */
  _lat: number | null;
  _lng: number | null;
}

export function parseCsv(value: string | null): string[] {
  if (!value) return [];
  return Array.from(new Set(value.split(",").map((v) => v.trim()).filter(Boolean)));
}

export function parseNumber(value: string | null): number | null | "invalid" {
  if (value === null || value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : "invalid";
}

export function averageRating(ratings: { rating: number }[]): number | null {
  if (ratings.length === 0) return null;
  const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
}

export function applyGeo(
  items: SearchItem[],
  origin: { lat: number; lng: number } | null,
  radiusKm: number | null
): SearchItem[] {
  if (!origin) return items;
  const result: SearchItem[] = [];
  for (const item of items) {
    if (item._lat === null || item._lng === null) continue;
    const distance = haversineDistanceKm(origin.lat, origin.lng, item._lat, item._lng);
    const limit =
      radiusKm === null ? item.serviceRadiusKm : Math.min(radiusKm, item.serviceRadiusKm);
    if (distance <= limit) {
      result.push({ ...item, distanceKm: Math.round(distance * 10) / 10 });
    }
  }
  return result;
}

export function sortItems(items: SearchItem[], sort: MusicianSort | null): SearchItem[] {
  const copy = [...items];
  const price = (i: SearchItem) => i.priceMin ?? Number.POSITIVE_INFINITY;
  switch (sort) {
    case "distance":
      return copy.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    case "price_asc":
      return copy.sort((a, b) => price(a) - price(b));
    case "price_desc":
      return copy.sort((a, b) => (b.priceMin ?? -1) - (a.priceMin ?? -1));
    case "rating":
      return copy.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
    default:
      return copy.sort((a, b) => b.createdAt - a.createdAt);
  }
}

export function toPublicItem(item: SearchItem) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _lat, _lng, createdAt, ...rest } = item;
  return rest;
}
