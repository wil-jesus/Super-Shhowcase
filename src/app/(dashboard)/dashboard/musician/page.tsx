"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

interface NamedItem {
  id: string;
  name: string;
}

interface MusicianSummary {
  id: string;
  stageName: string;
  bio: string | null;
  photoUrl: string | null;
  verified: boolean;
  skills: NamedItem[];
  genres: NamedItem[];
  priceMin: number | null;
  priceMax: number | null;
  serviceRadiusKm: number | null;
  latitude: number | null;
  longitude: number | null;
}

interface MediaItem {
  id: string;
  type: "IMAGE" | "VIDEO" | "AUDIO";
  url: string;
}

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function formatPriceRange(min: number | null, max: number | null) {
  if (min != null && max != null) return `${currency.format(min)} – ${currency.format(max)}`;
  if (min != null) return `A partir de ${currency.format(min)}`;
  if (max != null) return `Até ${currency.format(max)}`;
  return "Preço não informado";
}

const linkClasses = "text-sm font-medium text-blue-600 hover:text-blue-700";

export default function MusicianDashboardPage() {
  const [musician, setMusician] = useState<MusicianSummary | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [mediaError, setMediaError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/musicians/me");
        if (!response.ok) throw new Error("Falha ao carregar perfil");
        const data: MusicianSummary = await response.json();
        setMusician(data);

        try {
          const mediaResponse = await fetch(`/api/musicians/${data.id}/media`);
          if (!mediaResponse.ok) throw new Error("Falha ao carregar portfólio");
          const mediaData = await mediaResponse.json();
          setMedia(Array.isArray(mediaData.data) ? mediaData.data : []);
        } catch {
          setMediaError(true);
        }
      } catch {
        setError("Não foi possível carregar o seu perfil");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const hasLocation = musician?.latitude != null && musician?.longitude != null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Meu painel</h1>
        <Link href="/dashboard/musician/profile" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Editar perfil
        </Link>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3"><p className="text-sm text-red-700">{error}</p></div>}

      {loading ? (
        <>
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-7 w-1/2" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
        </>
      ) : musician ? (
        <>
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-3xl">
              {musician.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={musician.photoUrl} alt={musician.stageName} className="h-full w-full object-cover" />
              ) : (
                <span aria-hidden="true">👤</span>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-3xl font-bold text-gray-900">{musician.stageName}</h2>
              {musician.bio && <p className="line-clamp-2 text-sm text-gray-600">{musician.bio}</p>}
              <div className="mt-2">
                <Badge color={musician.verified ? "green" : "yellow"}>{musician.verified ? "Verificado" : "Aguardando verificação"}</Badge>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader><h2 className="font-semibold text-gray-900">Seu perfil</h2></CardHeader>
            <CardBody className="space-y-4">
              <div>
                <p className="mb-1 text-xs text-gray-500">Habilidades</p>
                {musician.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {musician.skills.map((skill) => <Badge key={skill.id} color="blue">{skill.name}</Badge>)}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Nenhuma habilidade selecionada. <Link href="/dashboard/musician/profile" className={linkClasses}>Editar perfil</Link>
                  </p>
                )}
              </div>
              <div>
                <p className="mb-1 text-xs text-gray-500">Gêneros</p>
                {musician.genres.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {musician.genres.map((genre) => <Badge key={genre.id} color="purple">{genre.name}</Badge>)}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Nenhum gênero selecionado. <Link href="/dashboard/musician/profile" className={linkClasses}>Editar perfil</Link>
                  </p>
                )}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-semibold text-gray-900">Portfólio</h2>
                {!mediaError && <Badge color="gray">{media.length} {media.length === 1 ? "mídia" : "mídias"}</Badge>}
              </div>
            </CardHeader>
            <CardBody className="space-y-3">
              {mediaError ? (
                <p className="text-sm text-red-700">Não foi possível carregar o portfólio.</p>
              ) : media.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhuma mídia no portfólio ainda.</p>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {media.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-3xl">
                      {item.type === "IMAGE" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.url} alt="Mídia do portfólio" className="h-full w-full object-cover" />
                      ) : (
                        <span role="img" aria-label={item.type === "VIDEO" ? "Vídeo" : "Áudio"}>{item.type === "VIDEO" ? "🎬" : "🎵"}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <Link href="/dashboard/musician/profile" className={linkClasses}>Gerenciar portfólio</Link>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h2 className="font-semibold text-gray-900">Atendimento</h2></CardHeader>
            <CardBody className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Faixa de preço</p>
                <p className="font-medium text-gray-900">{formatPriceRange(musician.priceMin, musician.priceMax)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Raio de atendimento</p>
                <p className="font-medium text-gray-900">{musician.serviceRadiusKm != null ? `${musician.serviceRadiusKm} km` : "Não informado"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Localização</p>
                {hasLocation ? (
                  <p className="font-medium text-gray-900">Localização definida</p>
                ) : (
                  <Link href="/dashboard/musician/profile" className={linkClasses}>Definir localização</Link>
                )}
              </div>
            </CardBody>
          </Card>
        </>
      ) : null}
    </div>
  );
}
