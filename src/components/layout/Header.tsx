import Link from "next/link";
import { NotificationBell } from "@/components/layout/NotificationBell";

export function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold text-brand-600">
          Showcase
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <NotificationBell />
          <Link href="/login" className="text-gray-600 hover:text-brand-600">
            Entrar
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700"
          >
            Criar conta
          </Link>
        </nav>
      </div>
    </header>
  );
}
