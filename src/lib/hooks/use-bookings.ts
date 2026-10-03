"use client";

import useSWR from "swr";

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Falha ao carregar os dados");
  }

  return response.json();
};

async function patch<T>(url: string, payload: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Falha ao atualizar a contratação");
  }

  return response.json();
}

export interface BookingItem {
  id: string;
  status: string;
  value: number | null;
  notes?: string | null;
  createdAt: string;
  event: { id: string; title: string; date: string; type: string; addressLabel: string | null; notes?: string | null };
  musician: { id: string; stageName: string; photoUrl: string | null; verified: boolean };
  client?: { id: string; user: { name: string } };
  payment?: { id: string; status: string; amount: number; platformFee: number };
  reviews?: { id: string; rating: number; comment: string | null }[];
}

interface BookingsResponse {
  data?: BookingItem[];
  bookings?: BookingItem[];
  total?: number;
}

export function useBookings(page = 1, limit = 20) {
  const { data, error, isLoading, mutate } = useSWR<BookingsResponse>(
    `/api/bookings?page=${page}&limit=${limit}`,
    fetcher,
  );
  const bookings = data?.data ?? data?.bookings ?? [];

  return {
    bookings,
    total: data?.total ?? bookings.length,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useBooking(id: string) {
  const { data, error, isLoading, mutate } = useSWR<BookingItem>(
    id ? `/api/bookings/${id}` : null,
    fetcher,
  );

  return { booking: data, isLoading, isError: error, mutate };
}

export async function updateBookingStatus(id: string, status: string) {
  return patch(`/api/bookings/${id}`, { status });
}