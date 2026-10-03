"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  useMusicianProfile,
  useMusicianReviews,
} from "@/lib/hooks/use-musicians";

export default function MusicianProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { musician, isLoading } = useMusicianProfile(id);
  const { reviews } = useMusicianReviews(id);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  if (!musician) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <div className="mb-4 text-5xl">🔍</div>
          <h1 className="text-xl font-semibold text-gray-900">
            Músico não encontrado
          </h1>
          <Link href="/search" className="mt-4 inline-block">
            <Button variant="secondary">Voltar para busca</Button>
          </Link>
        </div>
      </div>
    );
  }

  const rating = musician.avgRating
    ? Number(musician.avgRating).toFixed(1)
    : null;

  return (
    <div className="min-h-screen">
      <Header />

      <div className="relative h-64 bg-gradient-to-br from-brand-500 to-brand-700">
        {musician.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={musician.photoUrl}
            alt={musician.stageName}
            className="h-full w-full object-cover opacity-20"
          />
        )}
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="-mt-20 mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-end">
          <div className="h-32 w-32 flex-shrink-0 overflow-hidden rounded-xl border-4 border-white bg-gray-100 shadow-lg">
            {musician.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={musician.photoUrl}
                alt={musician.stageName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-4xl">
                🎵
              </div>
            )}
          </div>

          <div className="mb-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {musician.stageName}
              </h1>
              {musician.verified && (
                <Badge color="green">Verificado</Badge>
              )}
            </div>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
              {rating && (
                <span className="flex items-center gap-1">
                  <span className="text-yellow-500">⭐</span>
                  <span className="font-medium">{rating}</span>
                  <span className="text-gray-400">
                    ({musician.totalReviews} avaliações)
                  </span>
                </span>
              )}
              {musician.latitude !== null && (
                <span>📍 Atende raio de {musician.serviceRadiusKm}km</span>
              )}
            </div>
          </div>

          <div className="mb-2">
            <Link href={`/musicians/${musician.id}/book`}>
              <Button size="lg">Solicitar contratação</Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 pb-12 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            <Card>
              <CardBody>
                <h2 className="mb-2 font-semibold text-gray-900">Sobre</h2>
                {musician.bio ? (
                  <p className="whitespace-pre-wrap text-sm text-gray-600">
                    {musician.bio}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400">
                    Este músico ainda não adicionou uma biografia.
                  </p>
                )}
              </CardBody>
            </Card>

            {musician.skills.length > 0 && (
              <Card>
                <CardBody>
                  <h2 className="mb-3 font-semibold text-gray-900">
                    Habilidades
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {musician.skills.map((skill) => (
                      <Badge key={skill.id} color="blue">
                        {skill.name}
                        {skill.level && (
                          <span className="ml-1 text-xs opacity-60">
                            · {skill.level}
                          </span>
                        )}
                      </Badge>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}

            {musician.genres.length > 0 && (
              <Card>
                <CardBody>
                  <h2 className="mb-3 font-semibold text-gray-900">Gêneros</h2>
                  <div className="flex flex-wrap gap-2">
                    {musician.genres.map((genre) => (
                      <Badge key={genre.id} color="purple">
                        {genre.name}
                      </Badge>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}

            {musician.media.length > 0 && (
              <Card>
                <CardBody>
                  <h2 className="mb-3 font-semibold text-gray-900">Portfólio</h2>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {musician.media.map((media) => (
                      <div
                        key={media.id}
                        className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100"
                      >
                        {media.type === "IMAGE" ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={media.url}
                            alt="Portfolio"
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : media.type === "VIDEO" ? (
                          <video src={media.url} className="h-full w-full object-cover" controls />
                        ) : (
                          <audio src={media.url} controls className="w-full" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}

            <Card>
              <CardBody>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Avaliações</h2>
                  {rating && (
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">⭐</span>
                      <span className="font-semibold">{rating}</span>
                      <span className="text-sm text-gray-400">
                        ({musician.totalReviews})
                      </span>
                    </div>
                  )}
                </div>
                {reviews.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    Ainda não há avaliações para este músico.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div
                        key={review.id}
                        className="border-b border-gray-50 pb-4 last:border-0"
                      >
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">
                            {review.client?.name ?? "Anônimo"}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(review.createdAt).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                        <div className="mb-1 flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <span
                              key={index}
                              className={index < review.rating ? "text-yellow-400" : "text-gray-200"}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        {review.comment && (
                          <p className="text-sm text-gray-600">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardBody className="space-y-4">
                <h2 className="font-semibold text-gray-900">Valor</h2>
                {musician.priceMin !== null ? (
                  <div>
                    <p className="text-sm text-gray-500">A partir de</p>
                    <p className="text-2xl font-bold text-brand-600">
                      R$ {musician.priceMin.toFixed(0)}
                    </p>
                    {musician.priceMax !== null && (
                      <p className="text-sm text-gray-500">
                        até R$ {musician.priceMax.toFixed(0)}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">
                    Valor a combinar conforme o evento
                  </p>
                )}

                <Link href={`/musicians/${musician.id}/book`}>
                  <Button size="lg" className="w-full">Contratar</Button>
                </Link>
                <div className="space-y-2 border-t border-gray-50 pt-4 text-xs text-gray-500">
                  <p className="flex items-center gap-2">🔒 Pagamento seguro via escrow</p>
                  <p className="flex items-center gap-2">✅ Cancelamento gratuito até 48h antes</p>
                  <p className="flex items-center gap-2">💬 Chat direto com o músico</p>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}