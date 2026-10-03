"use client";

import useSWR from "swr";
import { useEffect, useState } from "react";

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Falha ao carregar os dados");
  }

  return response.json();
};

export interface MusicianSearchResult {
  id: string;
  stageName: string;
  bio: string | null;
  photoUrl: string | null;
  priceMin: number | null;
  priceMax: number | null;
  verified: boolean;
  serviceRadiusKm: number;
  latitude: number | null;
  longitude: number | null;
  distance: number | null;
  avgRating: number | null;
  totalReviews: number | null;
  skills: { id: string; name: string; category: string }[];
  genres: { id: string; name: string }[];
}

interface SearchResponse {
  results: Array<{
    id: string;
    stageName: string;
    photoUrl: string | null;
    avgRating: number;
    reviewCount: number;
    verified: boolean;
    priceMin: number | null;
    priceMax: number | null;
    distanceKm: number | null;
    skills: string[];
  }>;
  total: number;
  page: number;
  limit: number;
  offset: number;
}

interface MusicianProfileResponse {
  musician: MusicianProfile;
}

export function useMusiciansSearch(params: {
  q?: string;
  lat?: number;
  lng?: number;
  date?: string;
  skill?: string;
  genre?: string;
  page?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params.q) searchParams.set("q", params.q);
  if (params.lat !== undefined) searchParams.set("lat", String(params.lat));
  if (params.lng !== undefined) searchParams.set("lng", String(params.lng));
  if (params.date) searchParams.set("date", params.date);
  if (params.skill) searchParams.set("skill", params.skill);
  if (params.genre) searchParams.set("genre", params.genre);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));

  const key = params.q ? `/api/search?${searchParams.toString()}` : null;
  const { data, error, isLoading } = useSWR<SearchResponse>(key, fetcher);
  const musicians = (data?.results ?? []).map((result) => ({
    ...result,
    bio: null,
    distance: result.distanceKm,
    totalReviews: result.reviewCount,
    serviceRadiusKm: 0,
    latitude: null,
    longitude: null,
    genres: [],
    skills: result.skills.map((name, index) => ({
      id: `${result.id}-skill-${index}`,
      name,
      category: "INSTRUMENT",
    })),
  }));

  return {
    musicians,
    total: data?.total ?? 0,
    page: data ? Math.floor(data.offset / data.limit) + 1 : params.page ?? 1,
    limit: data?.limit ?? 20,
    isLoading,
    isError: error,
  };
}

export interface MusicianProfile {
  id: string;
  stageName: string;
  bio: string | null;
  photoUrl: string | null;
  priceMin: number | null;
  priceMax: number | null;
  verified: boolean;
  serviceRadiusKm: number;
  latitude: number | null;
  longitude: number | null;
  avgRating: number | null;
  totalReviews: number | null;
  skills: {
    id: string;
    name: string;
    category: string;
    level: string | null;
  }[];
  genres: { id: string; name: string }[];
  media: { id: string; type: string; url: string }[];
  availability: {
    id: string;
    startAt: string;
    endAt: string;
    blocked: boolean;
  }[];
  user: { name: string };
}

export function useMusicianProfile(id: string) {
  const { data, error, isLoading } = useSWR<MusicianProfileResponse>(
    id ? `/api/musicians/${id}` : null,
    fetcher,
  );

  return {
    musician: data?.musician,
    isLoading,
    isError: error,
  };
}

export interface MusicianReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  client?: { name: string | null };
}

interface ReviewsResponse {
  reviews?: MusicianReview[];
  data?: MusicianReview[];
}

export function useMusicianReviews(id: string) {
  const { data, error, isLoading } = useSWR<ReviewsResponse>(
    id ? `/api/musicians/${id}/reviews` : null,
    fetcher,
  );

  return {
    reviews: data?.reviews ?? data?.data ?? [],
    isLoading,
    isError: error,
  };
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export interface Skill {
  id: string;
  name: string;
  slug?: string;
  category?: string;
}

interface SkillsResponse {
  data: Skill[];
}

export function useSkills() {
  const { data, error, isLoading } = useSWR<SkillsResponse | Skill[]>(
    "/api/skills",
    fetcher,
  );

  const skills = Array.isArray(data) ? data : data?.data ?? [];

  return {
    skills,
    isLoading,
    isError: error,
  };
}
