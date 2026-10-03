"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useBooking } from "@/lib/hooks/use-bookings";

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { booking, isLoading } = useBooking(id);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (rating === 0) {
      setError("Selecione uma nota");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: id, rating, comment: comment.trim() || undefined }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Erro ao enviar avaliação");
      }
      router.push(`/dashboard/client/bookings/${id}`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Erro ao enviar avaliação");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return <Skeleton className="mx-auto h-64 w-full max-w-md rounded-xl" />;

  if (!booking) {
    return <p className="text-gray-500">Contratação não encontrada</p>;
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Avaliar músico</h1>

      <Card>
        <CardBody>
          <div className="mb-6 text-center">
            <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-2xl">
              🎵
            </div>
            <h2 className="font-semibold text-gray-900">{booking.musician.stageName}</h2>
            <p className="text-sm text-gray-500">{booking.event.title}</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <fieldset>
              <legend className="mb-2 block text-sm font-medium text-gray-700">Sua nota</legend>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    aria-label={`${star} ${star === 1 ? "estrela" : "estrelas"}`}
                    aria-pressed={star === rating}
                    onClick={() => setRating(star)}
                    className={`text-3xl transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                      star <= rating ? "text-yellow-400" : "text-gray-200"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor="review-comment" className="mb-1 block text-sm font-medium text-gray-700">
                Comentário (opcional)
              </label>
              <textarea
                id="review-comment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={4}
                maxLength={1000}
                placeholder="Conte como foi sua experiência..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <Button type="submit" loading={submitting} size="lg" className="w-full">
              Enviar avaliação
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}