"use client";

import useSWR from "swr";

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Falha ao carregar as notificações");
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
    throw new Error(body?.error ?? "Falha ao atualizar a notificação");
  }

  return response.json();
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  readAt: string | null;
  createdAt: string;
  bookingId: string | null;
}

interface NotificationsResponse {
  notifications?: NotificationItem[];
  data?: NotificationItem[];
  unreadCount?: number;
}

export function useNotifications() {
  const { data, error, isLoading, mutate } = useSWR<NotificationsResponse>(
    "/api/notifications",
    fetcher,
  );
  const notifications = data?.notifications ?? data?.data ?? [];
  const unreadCount = data?.unreadCount ?? notifications.filter((notification) => !notification.read).length;

  return {
    notifications,
    unreadCount,
    isLoading,
    isError: error,
    mutate,
  };
}

export async function markNotificationRead(id: string) {
  return patch("/api/notifications", { ids: [id] });
}