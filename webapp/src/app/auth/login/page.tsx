"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

type LoginData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>({ resolver: zodResolver(loginSchema) });

  const login = useMutation({
    mutationFn: (data: LoginData) => api.post("/auth/login", data),
    onSuccess: () => router.push("/admin"),
  });

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form
        onSubmit={handleSubmit((data) => login.mutate(data))}
        className="flex w-full max-w-sm flex-col gap-4 rounded-lg border p-8"
      >
        <h1 className="text-2xl font-bold">Entrar</h1>

        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium">E-mail</label>
          <input
            id="email"
            type="email"
            className="rounded-md border px-3 py-2 text-sm"
            {...register("email")}
          />
          {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-medium">Senha</label>
          <input
            id="password"
            type="password"
            className="rounded-md border px-3 py-2 text-sm"
            {...register("password")}
          />
          {errors.password && <span className="text-xs text-red-500">{errors.password.message}</span>}
        </div>

        {login.isError && (
          <span className="text-sm text-red-500">{(login.error as Error).message}</span>
        )}

        <Button type="submit" disabled={login.isPending}>
          {login.isPending ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </div>
  );
}
