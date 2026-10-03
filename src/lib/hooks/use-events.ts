"use client";

import useSWR from "swr";

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Falha ao carregar os dados");
  }

  return response.json();
};

async function request<T>(url: string, method: "POST" | "PATCH", payload: unknown): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Falha ao processar a solicitação");
  }

  return response.json();
}

export interface EventBooking {
  id: string;
  status: string;
  musician: { id?: string; stageName: string; photoUrl: string | null };
}

export interface EventItem {
  id: string;
  title: string;
  type: string;
  date: string;
  durationHours: number;
  locationLat: number;
  locationLng: number;
  addressLabel: string | null;
  notes: string | null;
  budget: number | null;
  status: string;
  bookings?: EventBooking[];
}

interface EventsResponse {
  data: EventItem[];
  total: number;
}

export function useEvents(page = 1, limit = 10) {
  const { data, error, isLoading, mutate } = useSWR<EventsResponse>(
    `/api/events?page=${page}&limit=${limit}`,
    fetcher,
  );

  return { events: data?.data ?? [], total: data?.total ?? 0, isLoading, isError: error, mutate };
}

export function useEvent(id: string) {
  const { data, error, isLoading, mutate } = useSWR<EventItem>(
    id ? `/api/events/${id}` : null,
    fetcher,
  );

  return { event: data, isLoading, isError: error, mutate };
}

export async function createEvent(payload: Record<string, unknown>) {
  return request<EventItem>("/api/events", "POST", payload);
}

export async function updateEvent(id: string, payload: Record<string, unknown>) {
  return request<EventItem>(`/api/events/${id}`, "PATCH", payload);
}

export async function bookMusician(
  eventId: string,
  payload: { musicianId: string; value?: number; notes?: string },
) {
  return request(`/api/events/${eventId}/book`, "POST", payload);
}