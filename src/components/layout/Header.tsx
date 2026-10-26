"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { useSession } from "@/lib/use-session";
import { homeForRole } from "@/lib/role-home";

export function Header() {
  const { session, isLoading } = useSession();
  const user = session?.user;

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold text-brand-600">
          Showcase
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {isLoading ? null : user ? (
            <>
              <NotificationBell />
              <Link href={homeForRole(user.role)} className="text-gray-600 hover:text-brand-600">
                {user.role === "ADMIN" ? "Administração" : "Meu painel"}
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:border-brand-300 hover:text-brand-600"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-600 hover:text-brand-600">
                Entrar
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700"
              >
                Criar conta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
