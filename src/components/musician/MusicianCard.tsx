"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import type { MusicianSearchResult } from "@/lib/hooks/use-musicians";

interface MusicianCardProps {
  musician: MusicianSearchResult;
}

const skillCategoryColors: Record<string, "blue" | "purple" | "green"> = {
  INSTRUMENT: "blue",
  VOCAL: "purple",
  FUNCTION: "green",
};

export function MusicianCard({ musician }: MusicianCardProps) {
  const rating = musician.avgRating ? Number(musician.avgRating).toFixed(1) : null;

  return (
    <Link href={`/musicians/${musician.id}`}>
      <div className="group cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:border-brand-300 hover:shadow-md">
        <div className="relative h-48 w-full bg-gray-100">
          {musician.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={musician.photoUrl}
              alt={musician.stageName}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-4xl">🎵</span>
            </div>
          )}

          {musician.verified && (
            <div className="absolute right-3 top-3">
              <Badge color="green">
                <span className="flex items-center gap-1">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verificado
                </span>
              </Badge>
            </div>
          )}
        </div>

        <div className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-gray-900 transition-colors group-hover:text-brand-600">
                {musician.stageName}
              </h3>
              {musician.distance !== null && (
                <p className="text-xs text-gray-500">
                  📍 {musician.distance < 1 ? `${Math.round(musician.distance * 1000)}m` : `${musician.distance.toFixed(1)} km`}
                </p>
              )}
            </div>
            {rating && (
              <div className="flex items-center gap-1">
                <span className="text-yellow-500">⭐</span>
                <span className="text-sm font-medium text-gray-700">{rating}</span>
                {musician.totalReviews && (
                  <span className="text-xs text-gray-400">({musician.totalReviews})</span>
                )}
              </div>
            )}
          </div>

          {musician.bio && (
            <p className="line-clamp-2 text-sm text-gray-600">{musician.bio}</p>
          )}

          {musician.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {musician.skills.slice(0, 3).map((skill) => (
                <Badge key={skill.id} color={skillCategoryColors[skill.category] ?? "gray"}>
                  {skill.name}
                </Badge>
              ))}
              {musician.skills.length > 3 && (
                <span className="self-center text-xs text-gray-400">
                  +{musician.skills.length - 3}
                </span>
              )}
            </div>
          )}

          {musician.priceMin !== null && (
            <div className="border-t border-gray-50 pt-2">
              <span className="text-xs text-gray-500">A partir de</span>{" "}
              <span className="font-semibold text-gray-900">
                R$ {musician.priceMin.toFixed(0)}
              </span>
              {musician.priceMax !== null && (
                <span className="text-xs text-gray-500">
                  {" "}- R$ {musician.priceMax.toFixed(0)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
