import { ReactNode } from "react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gray-50">
      <Link href="/" className="mb-8">
        <span className="text-2xl font-bold text-blue-600">Showcase</span>
      </Link>
      {children}
    </div>
  );
}
