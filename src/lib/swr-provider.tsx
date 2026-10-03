"use client";

import { ReactNode } from "react";
import { SWRConfig } from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to fetch");
  }
  return res.json();
};

export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        errorRetryCount: 2,
        shouldRetryOnError: (err) => err?.status !== 401 && err?.status !== 403,
      }}
    >
      {children}
    </SWRConfig>
  );
}
