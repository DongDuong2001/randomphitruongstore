"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({ password: z.string().min(1) });
type Values = z.infer<typeof schema>;

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { isSubmitting }
  } = useForm<Values>({ resolver: zodResolver(schema) });

  async function login(values: Values) {
    setError("");
    const response = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    if (!response.ok) {
      setError("Invalid admin password.");
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <form className="mt-8 space-y-4" onSubmit={handleSubmit(login)}>
      <label className="block">
        <span className="label text-white/60">Admin password</span>
        <input
          autoComplete="current-password"
          className="field border-white/20 bg-white/5 text-white placeholder:text-white/30 focus:border-[#d64b3d] focus:shadow-[0_0_0_1px_#d64b3d]"
          type="password"
          {...register("password")}
        />
      </label>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <button
        className="inline-flex min-h-12 w-full items-center justify-center bg-white px-5 text-xs font-black uppercase tracking-[0.12em] text-black transition-colors hover:bg-[#d64b3d] hover:text-white disabled:cursor-wait disabled:bg-zinc-700 disabled:text-zinc-400"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
