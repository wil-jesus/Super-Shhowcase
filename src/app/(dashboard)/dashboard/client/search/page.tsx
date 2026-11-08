"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatBRL } from "@/lib/event-format";

interface Option {
  id: string;
  name: string;
}

interface MusicianItem {
  id: string;
  stageName: string;
  photoUrl: string | null;
  priceMin: number | null;
  priceMax: number | null;
  serviceRadiusKm: number;
  skills: Option[];
  genres: Option[];
  rating: number | null;
  distanceKm: number | null;
}

interface MusiciansResponse {
  musicians: MusicianItem[];
  total: number;
}

const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Falha na requisição");
  return res.json();
};

const SORT_OPTIONS = [
  { value: "", label: "Mais recentes" },
  { value: "distance", label: "Mais próximos" },
  { value: "price_asc", label: "Menor preço" },
  { value: "price_desc", label: "Maior preço" },
  { value: "rating", label: "Melhor avaliação" },
];

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none";

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 snap-start whitespace-nowrap rounded-full border px-3 py-1 text-xs transition ${
        active
          ? "border-brand-600 bg-brand-600 text-white"
          : "border-gray-300 bg-white text-gray-700 hover:border-brand-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
      }`}
    >
      {label}
    </button>
  );
}

function ChipCarousel({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState({ left: false, right: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setOverflow({
      left: el.scrollLeft > 1,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
    });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    Array.from(el.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [update, children]);

  const scroll = (direction: 1 | -1) =>
    ref.current?.scrollBy({ left: direction * ref.current.clientWidth * 0.8, behavior: "smooth" });

  const arrow =
    "hidden h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 hover:border-brand-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 md:flex";

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Rolar para a esquerda"
        onClick={() => scroll(-1)}
        className={`${arrow} ${overflow.left ? "" : "md:invisible"}`}
      >
        ‹
      </button>
      <div
        ref={ref}
        onScroll={update}
        className="flex min-w-0 flex-1 snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [scrollbar-color:#9ca3af_transparent] [scrollbar-width:thin]"
      >
        {children}
      </div>
      <button
        type="button"
        aria-label="Rolar para a direita"
        onClick={() => scroll(1)}
        className={`${arrow} ${overflow.right ? "" : "md:invisible"}`}
      >
        ›
      </button>
    </div>
  );
}

function toggle(list: string[], id: string) {
  return list.includes(id) ? list.filter((v) => v !== id) : [...list, id];
}

export default function ClientSearchPage() {
  const [skillIds, setSkillIds] = useState<string[]>([]);
  const [genreIds, setGenreIds] = useState<string[]>([]);
  const [radiusKm, setRadiusKm] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sort, setSort] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  const { data: skillsData } = useSWR<{ data: Option[] }>("/api/skills", fetcher);
  const { data: genresData } = useSWR<{ data: Option[] }>("/api/genres", fetcher);

  const params = new URLSearchParams();
  if (skillIds.length) params.set("skillIds", skillIds.join(","));
  if (genreIds.length) params.set("genreIds", genreIds.join(","));
  if (priceMin) params.set("priceMin", priceMin);
  if (priceMax) params.set("priceMax", priceMax);
  if (coords) {
    params.set("lat", String(coords.lat));
    params.set("lng", String(coords.lng));
    if (radiusKm) params.set("radiusKm", radiusKm);
  }
  // sort=distance exige localização; sem ela cai no padrão.
  if (sort && (sort !== "distance" || coords)) params.set("sort", sort);
  params.set("limit", "20");

  const { data, error, isLoading } = useSWR<MusiciansResponse>(
    `/api/musicians?${params.toString()}`,
    fetcher,
  );
  const musicians = data?.musicians ?? [];

  function useLocation() {
    if (!navigator.geolocation) {
      setGeoStatus("error");
      return;
    }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus("ok");
      },
      () => setGeoStatus("error"),
    );
  }

  function clearFilters() {
    setSkillIds([]);
    setGenreIds([]);
    setRadiusKm("");
    setPriceMin("");
    setPriceMax("");
    setSort("");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Buscar músicos</h1>
          <p className="text-sm text-gray-600">Filtre por habilidades, gêneros, preço e distância</p>
        </div>
        <Link href="/dashboard/client" className="text-sm text-brand-600 hover:text-brand-700">
          Voltar
        </Link>
      </div>

      <Card>
        <CardBody className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Habilidades</p>
            <ChipCarousel>
              {(skillsData?.data ?? []).map((s) => (
                <Chip
                  key={s.id}
                  label={s.name}
                  active={skillIds.includes(s.id)}
                  onClick={() => setSkillIds(toggle(skillIds, s.id))}
                />
              ))}
            </ChipCarousel>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Gêneros</p>
            <ChipCarousel>
              {(genresData?.data ?? []).map((g) => (
                <Chip
                  key={g.id}
                  label={g.name}
                  active={genreIds.includes(g.id)}
                  onClick={() => setGenreIds(toggle(genreIds, g.id))}
                />
              ))}
            </ChipCarousel>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <label className="text-sm text-gray-700">
              Raio (km){radiusKm ? `: ${radiusKm}` : ""}
              <input
                type="range"
                min={5}
                max={500}
                step={5}
                value={radiusKm || 50}
                onChange={(e) => setRadiusKm(e.target.value)}
                disabled={!coords}
                className="mt-2 w-full"
              />
            </label>
            <label className="text-sm text-gray-700">
              Preço mínimo (R$)
              <input
                type="number"
                min={0}
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                className={`mt-1 ${inputClass}`}
              />
            </label>
            <label className="text-sm text-gray-700">
              Preço máximo (R$)
              <input
                type="number"
                min={0}
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                className={`mt-1 ${inputClass}`}
              />
            </label>
            <label className="text-sm text-gray-700">
              Ordenar por
              <select value={sort} onChange={(e) => setSort(e.target.value)} className={`mt-1 ${inputClass}`}>
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} disabled={o.value === "distance" && !coords}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="secondary" size="sm" onClick={useLocation} disabled={geoStatus === "loading"}>
              {geoStatus === "ok" ? "Localização ativa" : "Usar minha localização"}
            </Button>
            {geoStatus === "error" && (
              <span className="text-xs text-red-600">Não foi possível obter sua localização.</span>
            )}
            {geoStatus === "ok" && (
              <span className="text-xs text-gray-500">Defina o raio e ordene por distância.</span>
            )}
            <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
              Limpar filtros
            </Button>
          </div>
        </CardBody>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardBody>
            <p className="text-sm text-red-700">Não foi possível carregar os músicos. Tente novamente.</p>
          </CardBody>
        </Card>
      ) : musicians.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center">
            <p className="text-sm font-medium text-gray-700">Nenhum músico encontrado</p>
            <p className="mt-1 text-xs text-gray-400">Tente ampliar o raio, o preço ou remover alguns filtros</p>
            <Button size="sm" className="mt-3" onClick={clearFilters}>
              Ajustar filtros
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {musicians.map((m) => (
            <Card key={m.id}>
              <CardBody className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-full bg-gray-100">
                    {m.photoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.photoUrl} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900">{m.stageName}</p>
                    <p className="text-sm text-gray-600">
                      {m.priceMin != null && m.priceMax != null
                        ? `${formatBRL(m.priceMin)} – ${formatBRL(m.priceMax)}`
                        : m.priceMin != null
                          ? `A partir de ${formatBRL(m.priceMin)}`
                          : "Preço a combinar"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Atende raio de {m.serviceRadiusKm}km
                      {m.distanceKm != null && ` · a ${m.distanceKm}km de você`}
                      {m.rating != null && ` · ★ ${m.rating}`}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {m.skills.map((s) => (
                    <Badge key={s.id} color="blue">{s.name}</Badge>
                  ))}
                  {m.genres.map((g) => (
                    <Badge key={g.id} color="purple">{g.name}</Badge>
                  ))}
                </div>
                <Link
                  href={`/musicians/${m.id}`}
                  className="text-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  Ver perfil
                </Link>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
