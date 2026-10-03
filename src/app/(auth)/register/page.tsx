"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardBody } from "@/components/ui/Card";

const registerSchema = z
  .object({
    name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
    email: z.string().email("E-mail inválido"),
    password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
    confirmPassword: z.string(),
    role: z.enum(["CLIENT", "MUSICIAN"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  });

type RegisterData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "CLIENT" },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: RegisterData) => {
    setServerError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Falha no cadastro");
      }

      router.push("/login?registered=1");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Erro inesperado");
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardBody className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Criar conta</h1>
          <p className="mt-1 text-sm text-gray-600">
            Junte-se ao Showcase como cliente ou músico
          </p>
        </div>

        {serverError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">{serverError}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {(["CLIENT", "MUSICIAN"] as const).map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setValue("role", role, { shouldValidate: true })}
              className={`rounded-lg border-2 p-4 text-left transition-colors ${
                selectedRole === role
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="font-medium text-gray-900">
                {role === "CLIENT" ? "Sou Cliente" : "Sou Músico"}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {role === "CLIENT" ? "Quero contratar músicos" : "Quero ser contratado"}
              </div>
            </button>
          ))}
        </div>
        {errors.role && <p className="text-xs text-red-600">{errors.role.message}</p>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nome completo"
            placeholder="João da Silva"
            register={register("name")}
            error={errors.name?.message}
          />
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
          <Input
            label="Confirmar senha"
            type="password"
            placeholder="********"
            register={register("confirmPassword")}
            error={errors.confirmPassword?.message}
          />

          <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
            Criar conta
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600">
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">
            Entrar
          </Link>
        </p>
      </CardBody>
    </Card>
  );
}
