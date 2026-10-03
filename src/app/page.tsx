"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="min-h-screen">
      <Header />

      <section className="bg-gradient-to-b from-brand-50 to-white px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold text-gray-900 md:text-5xl">
            Encontre o músico perfeito
            <br />
            <span className="text-brand-600">para o seu evento</span>
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Casamentos, festas, eventos corporativos: conecte-se com artistas verificados
          </p>

          <form onSubmit={handleSearch} className="mx-auto mt-8 flex max-w-xl gap-2">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Busque por instrumento, gênero ou nome..."
              className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
            <Button type="submit" size="lg">
              Buscar
            </Button>
          </form>

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {["DJ", "Violão", "Banda", "Piano", "Saxofone", "Coral"].map((tag) => (
              <button
                key={tag}
                onClick={() => router.push(`/search?q=${encodeURIComponent(tag)}`)}
                className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 hover:border-brand-300 hover:text-brand-600"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          {[
            { icon: "🔍", title: "Busca inteligente", desc: "Filtre por habilidade, localização e disponibilidade" },
            { icon: "🔒", title: "Pagamento seguro", desc: "Escrow protege cliente e músico até a conclusão" },
            { icon: "⭐", title: "Avaliações reais", desc: "Sistema de reputação baseado em contratações confirmadas" },
          ].map((feature) => (
            <div key={feature.title} className="text-center">
              <div className="mb-3 text-4xl">{feature.icon}</div>
              <h2 className="font-semibold text-gray-900">{feature.title}</h2>
              <p className="mt-1 text-sm text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}