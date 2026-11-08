"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { mutate } from "swr";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useMusicianProfile } from "@/lib/hooks/use-musicians";
import { useSession } from "@/lib/use-session";
import { normalizeDecimalInput } from "@/lib/decimal";
import { formatBRL } from "@/lib/event-format";

const decimal = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(normalizeDecimalInput, schema) as unknown as z.ZodType<z.output<T>, z.ZodTypeDef, z.output<T>>;

const bookSchema = z.object({
  eventTitle: z.string().trim().min(3, "Título deve ter no mínimo 3 caracteres").max(120),
  eventType: z.enum(["WEDDING", "BIRTHDAY", "CORPORATE", "PARTY", "OTHER"]),
  eventDate: z
    .string()
    .min(1, "Data é obrigatória")
    .refine((value) => new Date(value) > new Date(), "A data do evento deve ser no futuro"),
  durationHours: decimal(
    z.coerce.number({ invalid_type_error: "Informe um número válido" }).min(1, "Mínimo 1 hora").max(24, "Máximo 24 horas"),
  ),
  addressLabel: z.string().max(300).optional(),
  notes: z.string().max(2000).optional(),
  value: decimal(
    z.coerce.number({ invalid_type_error: "Informe um número válido (ex.: 499,99)" }).min(0, "O valor não pode ser negativo").optional(),
  ),
});

type BookFormData = z.infer<typeof bookSchema>;

// Coordenadas padrão (São Paulo), as mesmas usadas em "Criar evento", quando o músico não tem localização.
const DEFAULT_LOCATION = { lat: -23.5505, lng: -46.6333 };

export default function BookMusicianPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { session, isLoading: sessionLoading } = useSession();
  const { musician, isLoading: musicianLoading } = useMusicianProfile(id);
  const [serverError, setServerError] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationHint, setLocationHint] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BookFormData>({
    resolver: zodResolver(bookSchema),
    defaultValues: { eventType: "OTHER", durationHours: 3 },
  });

  useEffect(() => {
    if (!sessionLoading && !session?.user) {
      router.replace(`/login?callbackUrl=${encodeURIComponent(`/musicians/${id}`)}`);
    }
  }, [sessionLoading, session, router, id]);

  useEffect(() => {
    if (musician?.priceMin != null) setValue("value", musician.priceMin);
  }, [musician?.priceMin, setValue]);

  const getMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationHint("Seu navegador não oferece geolocalização.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationHint("Usando sua localização atual.");
      },
      () => setLocationHint("Não foi possível obter sua localização."),
    );
  };

  const onSubmit = async (data: BookFormData) => {
    if (!musician) return;
    setServerError("");

    const coordinates =
      location ??
      (musician.latitude != null && musician.longitude != null
        ? { lat: musician.latitude, lng: musician.longitude }
        : DEFAULT_LOCATION);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          musicianId: musician.id,
          eventTitle: data.eventTitle,
          eventType: data.eventType,
          eventDate: new Date(data.eventDate).toISOString(),
          durationHours: data.durationHours,
          locationLat: coordinates.lat,
          locationLng: coordinates.lng,
          addressLabel: data.addressLabel,
          notes: data.notes,
          value: data.value,
        }),
      });
      const body = await response.json().catch(() => null);

      if (response.status === 401) {
        router.replace(`/login?callbackUrl=${encodeURIComponent(`/musicians/${id}`)}`);
        return;
      }
      if (!response.ok) {
        setServerError(body?.error ?? "Não foi possível enviar a solicitação");
        return;
      }

      await mutate((key) => typeof key === "string" && key.startsWith("/api/bookings"), undefined, {
        revalidate: false,
      });
      router.push(`/dashboard/client/bookings/${body.booking.id}?created=1`);
    } catch {
      setServerError("Erro de conexão. Tente novamente.");
    }
  };

  if (sessionLoading || musicianLoading || !session?.user) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!musician) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="text-xl font-semibold text-gray-900">Músico não encontrado</h1>
          <Link href="/search" className="mt-4 inline-block">
            <Button variant="secondary">Voltar para busca</Button>
          </Link>
        </div>
      </div>
    );
  }

  const canBook = session.user.role === "CLIENT" || session.user.role === "ADMIN";

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <div>
          <Link href={`/musicians/${musician.id}`} className="text-sm text-brand-600 hover:text-brand-700">
            ← Voltar ao perfil
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Solicitar contratação</h1>
        </div>

        <Card>
          <CardBody className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100">
                {musician.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={musician.photoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl">🎵</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-gray-900">{musician.stageName}</h2>
                  {musician.verified && <Badge color="green">Verificado</Badge>}
                </div>
                <p className="text-sm text-gray-600">
                  {musician.priceMin != null
                    ? `A partir de ${formatBRL(musician.priceMin)}${musician.priceMax != null ? ` · até ${formatBRL(musician.priceMax)}` : ""}`
                    : "Valor a combinar conforme o evento"}
                </p>
              </div>
            </div>
            {(musician.skills.length > 0 || musician.genres.length > 0) && (
              <div className="flex flex-wrap gap-2">
                {musician.skills.map((skill) => (
                  <Badge key={skill.id} color="blue">{skill.name}</Badge>
                ))}
                {musician.genres.map((genre) => (
                  <Badge key={genre.id} color="purple">{genre.name}</Badge>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {!canBook ? (
          <Card>
            <CardBody>
              <p className="text-sm text-gray-700">
                Apenas contas de cliente podem solicitar contratações. Entre com uma conta de cliente para continuar.
              </p>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardBody>
              {serverError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm text-red-700">{serverError}</p>
                </div>
              )}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="Nome do evento"
                  placeholder="Casamento da Maria"
                  register={register("eventTitle")}
                  error={errors.eventTitle?.message}
                />
                <div>
                  <label htmlFor="eventType" className="mb-1 block text-sm font-medium text-gray-700">Tipo</label>
                  <select
                    id="eventType"
                    {...register("eventType")}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="OTHER">Outro</option>
                    <option value="WEDDING">Casamento</option>
                    <option value="BIRTHDAY">Aniversário</option>
                    <option value="CORPORATE">Corporativo</option>
                    <option value="PARTY">Festa</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Data e hora"
                    type="datetime-local"
                    register={register("eventDate")}
                    error={errors.eventDate?.message}
                  />
                  <Input
                    label="Duração (horas)"
                    type="text"
                    inputMode="decimal"
                    register={register("durationHours")}
                    error={errors.durationHours?.message}
                  />
                </div>
                <Input
                  label="Endereço — opcional"
                  placeholder="Rua, número, bairro, cidade"
                  register={register("addressLabel")}
                  error={errors.addressLabel?.message}
                />
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="button" variant="secondary" size="sm" onClick={getMyLocation}>
                    📍 Usar minha localização
                  </Button>
                  {locationHint && <span className="text-xs text-gray-500">{locationHint}</span>}
                </div>
                <Input
                  label="Valor proposto (R$) — opcional"
                  type="text"
                  inputMode="decimal"
                  placeholder="500,00"
                  register={register("value")}
                  error={errors.value?.message}
                />
                <div>
                  <label htmlFor="notes" className="mb-1 block text-sm font-medium text-gray-700">
                    Mensagem para o músico — opcional
                  </label>
                  <textarea
                    id="notes"
                    {...register("notes")}
                    rows={4}
                    placeholder="Detalhes sobre o evento, repertório, etc."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                  {errors.notes && <p className="mt-1 text-xs text-red-600">{errors.notes.message}</p>}
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" loading={isSubmitting} size="lg" className="flex-1">
                    Enviar solicitação
                  </Button>
                  <Link href={`/musicians/${musician.id}`}>
                    <Button type="button" variant="ghost" size="lg">Cancelar</Button>
                  </Link>
                </div>
              </form>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
