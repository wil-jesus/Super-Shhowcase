"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { mutate } from "swr";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardBody } from "@/components/ui/Card";
import { useSession } from "@/lib/use-session";
import { homeForRole, safeCallbackUrl } from "@/lib/role-home";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

type LoginData = z.infer<typeof loginSchema>;

function resolveTarget(role?: string): string {
  const callback = safeCallbackUrl(
    new URLSearchParams(window.location.search).get("callbackUrl"),
    window.location.origin,
  );
  return callback ?? homeForRole(role);
}

export default function LoginPage() {
  const router = useRouter();
  const { session } = useSession();
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginData>({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    if (!session?.user) return;
    router.replace(resolveTarget(session.user.role));
  }, [session, router]);

  const onSubmit = async (data: LoginData) => {
    setServerError("");
    const result = await signIn("credentials", { ...data, redirect: false });

    if (!result || result.error) {
      setServerError(
        result?.error === "RATE_LIMITED"
          ? "Muitas tentativas. Aguarde alguns minutos e tente novamente."
          : "E-mail ou senha incorretos"
      );
      return;
    }

    let role: string | undefined;
    try {
      const me = await fetch("/api/auth/me", { cache: "no-store" });
      if (me.ok) role = (await me.json()).user?.role;
    } catch {
      // sem role: resolveTarget cai em "/"
    }

    await mutate("/api/auth/me", undefined, { revalidate: false });
    router.replace(resolveTarget(role));
    router.refresh();
  };

  if (session?.user) {
    return (
      <Card className="w-full max-w-md">
        <CardBody>
          <p className="text-sm text-gray-600">Você já está conectado. Redirecionando...</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardBody className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Entrar</h1>
          <p className="mt-1 text-sm text-gray-600">
            Acesse sua conta para contratar ou ser contratado
          </p>
        </div>

        {serverError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">{serverError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="E-mail"
            type="email"
            placeholder="voce@email.com"
            register={register("email")}
            error={errors.email?.message}
          />
          <Input
            label="Senha"
            type="password"
            placeholder="********"
            register={register("password")}
            error={errors.password?.message}
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" className="rounded border-gray-300" />
              Lembrar de mim
            </label>
            <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
              Esqueci a senha
            </Link>
          </div>

          <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
            Entrar
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600">
          Não tem conta?{" "}
          <Link href="/register" className="font-medium text-blue-600 hover:text-blue-700">
            Cadastre-se
          </Link>
        </p>
      </CardBody>
    </Card>
  );
}
