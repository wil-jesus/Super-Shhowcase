import { MusicianCard } from "./MusicianCard";
import { MusicianCardSkeleton } from "@/components/ui/Skeleton";
import type { MusicianSearchResult } from "@/lib/hooks/use-musicians";

interface MusicianGridProps {
  musicians: MusicianSearchResult[];
  isLoading: boolean;
  skeletonCount?: number;
}

export function MusicianGrid({
  musicians,
  isLoading,
  skeletonCount = 6,
}: MusicianGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <MusicianCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (musicians.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="mb-4 text-5xl">🎤</div>
        <h3 className="text-lg font-semibold text-gray-900">
          Nenhum músico encontrado
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Tente ajustar os filtros ou ampliar a área de busca
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {musicians.map((musician) => (
        <MusicianCard key={musician.id} musician={musician} />
      ))}
    </div>
  );
}
