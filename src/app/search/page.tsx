"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { MusicianGrid } from "@/components/musician/MusicianGrid";
import { SearchFilters } from "@/components/musician/SearchFilters";
import { Button } from "@/components/ui/Button";
import { useDebounce, useMusiciansSearch } from "@/lib/hooks/use-musicians";

function SearchPageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);
  const [sort, setSort] = useState("relevance");
  const [showFilters, setShowFilters] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  const { musicians, total, isLoading } = useMusiciansSearch({
    q: debouncedQuery || undefined,
    skill: selectedSkill ?? undefined,
    page: 1,
    limit: 20,
  });

  const sortedMusicians = useMemo(() => {
    const sorted = [...musicians];
    switch (sort) {
      case "price_asc":
        return sorted.sort((a, b) => (a.priceMin ?? 0) - (b.priceMin ?? 0));
      case "price_desc":
        return sorted.sort((a, b) => (b.priceMin ?? 0) - (a.priceMin ?? 0));
      case "rating":
        return sorted.sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));
      case "distance":
        return sorted.sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));
      default:
        return sorted;
    }
  }, [musicians, sort]);

  const filteredByPrice = useMemo(() => {
    if (!priceRange) return sortedMusicians;
    return sortedMusicians.filter((musician) => {
      const min = musician.priceMin ?? 0;
      const max = musician.priceMax ?? 999999;
      return min >= priceRange[0] && max <= priceRange[1];
    });
  }, [sortedMusicians, priceRange]);

  const filters = (
    <SearchFilters
      selectedSkill={selectedSkill}
      onSelectSkill={setSelectedSkill}
      priceRange={priceRange}
      onPriceChange={setPriceRange}
      sort={sort}
      onSortChange={setSort}
    />
  );

  return (
    <div className="min-h-screen">
      <Header />

      <div className="sticky top-16 z-40 border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nome, instrumento, gênero musical..."
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowFilters((visible) => !visible)}
              className="md:hidden"
            >
              Filtros
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex gap-6">
          <aside className="hidden w-64 flex-shrink-0 md:block">
            <div className="sticky top-36">{filters}</div>
          </aside>

          {showFilters && (
            <div className="fixed inset-0 z-50 md:hidden">
              <button
                type="button"
                aria-label="Fechar filtros"
                className="absolute inset-0 h-full w-full cursor-default bg-black/40"
                onClick={() => setShowFilters(false)}
              />
              <div className="absolute right-0 top-0 h-full w-80 overflow-y-auto bg-white p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="font-semibold">Filtros</h2>
                  <button
                    type="button"
                    aria-label="Fechar filtros"
                    onClick={() => setShowFilters(false)}
                    className="text-xl text-gray-500 hover:text-gray-900"
                  >
                    ✕
                  </button>
                </div>
                {filters}
              </div>
            </div>
          )}

          <main className="flex-1">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {isLoading ? "Buscando..." : `${total} músico(s) encontrado(s)`}
              </p>
            </div>
            <MusicianGrid
              musicians={filteredByPrice}
              isLoading={isLoading}
              skeletonCount={6}
            />
          </main>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <SearchPageContent />
    </Suspense>
  );
}