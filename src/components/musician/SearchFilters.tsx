"use client";

import { useSkills } from "@/lib/hooks/use-musicians";
import { Badge } from "@/components/ui/Badge";

interface SearchFiltersProps {
  selectedSkill: string | null;
  onSelectSkill: (skill: string | null) => void;
  priceRange: [number, number] | null;
  onPriceChange: (range: [number, number] | null) => void;
  sort: string;
  onSortChange: (sort: string) => void;
}

export function SearchFilters({
  selectedSkill,
  onSelectSkill,
  priceRange,
  onPriceChange,
  sort,
  onSortChange,
}: SearchFiltersProps) {
  const { skills, isLoading } = useSkills();

  return (
    <div className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Ordenar por
        </label>
        <select
          value={sort}
          onChange={(event) => onSortChange(event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        >
          <option value="relevance">Relevância</option>
          <option value="price_asc">Menor preço</option>
          <option value="price_desc">Maior preço</option>
          <option value="rating">Melhor avaliação</option>
          <option value="distance">Mais próximos</option>
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Faixa de preço (R$)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Mín"
            value={priceRange?.[0] ?? ""}
            onChange={(event) => {
              const value = event.target.value ? Number(event.target.value) : 0;
              onPriceChange([value, priceRange?.[1] ?? 10000]);
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
          <span className="text-gray-400">-</span>
          <input
            type="number"
            placeholder="Máx"
            value={priceRange?.[1] ?? ""}
            onChange={(event) => {
              const value = event.target.value ? Number(event.target.value) : 10000;
              onPriceChange([priceRange?.[0] ?? 0, value]);
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Habilidades
        </label>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-7 w-24 animate-pulse rounded bg-gray-100"
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <button
                key={skill.id}
                type="button"
                onClick={() =>
                  onSelectSkill(selectedSkill === skill.name ? null : skill.name)
                }
              >
                <Badge color={selectedSkill === skill.name ? "blue" : "gray"}>
                  {skill.name}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </div>

      {(selectedSkill || priceRange) && (
        <button
          type="button"
          onClick={() => {
            onSelectSkill(null);
            onPriceChange(null);
          }}
          className="text-sm text-red-600 hover:text-red-700"
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}
