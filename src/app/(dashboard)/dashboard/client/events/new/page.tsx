"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { createEvent } from "@/lib/hooks/use-events";

const eventSchema = z.object({
  title: z.string().min(3, "Título deve ter no mínimo 3 caracteres").max(120),
  type: z.enum(["WEDDING", "BIRTHDAY", "CORPORATE", "PARTY", "OTHER"]),
  date: z.string().min(1, "Data é obrigatória"),
  durationHours: z.coerce.number().min(1, "Mínimo 1 hora").max(24, "Máximo 24 horas"),
  addressLabel: z.string().max(300).optional(),
  budget: z.coerce.number().min(0).optional(),
  notes: z.string().max(2000).optional(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

type EventFormData = z.infer<typeof eventSchema>;

export default function NewEventPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [gettingLocation, setGettingLocation] = useState(false);
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: { type: "OTHER", durationHours: 4, latitude: -23.5505, longitude: -46.6333 },
  });

  const getLocation = () => {
    if (!navigator.geolocation) {
      setServerError("Seu navegador não oferece geolocalização");
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValue("latitude", position.coords.latitude, { shouldValidate: true });
        setValue("longitude", position.coords.longitude, { shouldValidate: true });
        setGettingLocation(false);
      },
      () => {
        setServerError("Não foi possível obter sua localização");
        setGettingLocation(false);
      },
    );
  };

  const onSubmit = async (data: EventFormData) => {
    setServerError("");
    try {
      const event = await createEvent({
        title: data.title,
        type: data.type,
        date: new Date(data.date).toISOString(),
        durationHours: data.durationHours,
        locationLat: data.latitude,
        locationLng: data.longitude,
        addressLabel: data.addressLabel,
        budget: data.budget,
        notes: data.notes,
      });
      router.push(`/dashboard/client/events/${event.id}`);
      router.refresh();
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Erro ao criar evento");
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Criar evento</h1>
        <p className="text-sm text-gray-600">Preencha os dados do seu evento</p>
      </div>

      {serverError && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3"><p className="text-sm text-red-700">{serverError}</p></div>}

      <Card>
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Título do evento" placeholder="Casamento da Maria" register={register("title")} error={errors.title?.message} />
            <div>
              <label htmlFor="type" className="mb-1 block text-sm font-medium text-gray-700">Tipo</label>
              <select id="type" {...register("type")} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500">
                <option value="OTHER">Outro</option><option value="WEDDING">Casamento</option><option value="BIRTHDAY">Aniversário</option><option value="CORPORATE">Corporativo</option><option value="PARTY">Festa</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Data e hora" type="datetime-local" register={register("date")} error={errors.date?.message} />
              <Input label="Duração (horas)" type="number" step="0.5" register={register("durationHours")} error={errors.durationHours?.message} />
            </div>
            <Input label="Endereço" placeholder="Rua, número, bairro, cidade" register={register("addressLabel")} error={errors.addressLabel?.message} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Latitude" type="number" step="any" register={register("latitude")} error={errors.latitude?.message} />
              <Input label="Longitude" type="number" step="any" register={register("longitude")} error={errors.longitude?.message} />
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={getLocation} loading={gettingLocation}>📍 Usar minha localização</Button>
            <Input label="Orçamento (R$) — opcional" type="number" step="0.01" placeholder="500,00" register={register("budget")} error={errors.budget?.message} />
            <div>
              <label htmlFor="notes" className="mb-1 block text-sm font-medium text-gray-700">Observações — opcional</label>
              <textarea id="notes" {...register("notes")} rows={3} placeholder="Detalhes sobre o evento, repertório, etc." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
              {errors.notes && <p className="mt-1 text-xs text-red-600">{errors.notes.message}</p>}
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={isSubmitting} size="lg" className="flex-1">Criar evento</Button>
              <Button type="button" variant="ghost" size="lg" onClick={() => router.back()}>Cancelar</Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}