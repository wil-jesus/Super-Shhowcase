"use client";

import useSWR from "swr";

interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "CLIENT" | "MUSICIAN" | "ADMIN";
}

interface SessionData {
  user: SessionUser;
  expires?: string;
}

const fetcher = async (url: string): Promise<SessionData> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Não autenticado");
  }

  return response.json();
};

export function useSession() {
  const { data, error, isLoading } = useSWR<SessionData>(
    "/api/auth/me",
    fetcher,
    {
      shouldRetryOnError: false,
    },
  );

  return {
    session: data,
    isLoading,
    isError: error,
  };
}
