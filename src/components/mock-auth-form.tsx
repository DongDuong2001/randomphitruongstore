"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  fullName: z.string().trim().optional(),
  email: z.string().trim().email(),
  password: z.string().min(6)
});

type Values = z.infer<typeof schema>;

export function MockAuthForm({
  mode,
  labels
}: {
  mode: "login" | "register";
  labels: Record<string, string>;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<Values>({
    resolver: zodResolver(schema)
  });

  function submit(values: Values) {
    window.localStorage.setItem(
      "random.phitruong.customer.preview",
      JSON.stringify({
        email: values.email,
        fullName: values.fullName,
        mode,
        signedInAt: new Date().toISOString()
      })
    );
    router.push("/cart");
  }

  return (
    <form
      className="mt-8 grid gap-5 border border-black/15 bg-white p-5 shadow-[8px_8px_0_rgba(17,16,14,0.08)] sm:p-8"
      onSubmit={handleSubmit(submit)}
    >
      {mode === "register" ? (
        <label>
          <span className="label">{labels.fullName}</span>
          <input className="field" autoComplete="name" {...register("fullName")} />
        </label>
      ) : null}
      <label>
        <span className="label">{labels.email}</span>
        <input
          className="field"
          autoComplete="email"
          type="email"
          {...register("email")}
        />
        {errors.email ? <span className="error-text">{labels.invalidEmail}</span> : null}
      </label>
      <label>
        <span className="label">{labels.password}</span>
        <input
          className="field"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          type="password"
          {...register("password")}
        />
        {errors.password ? (
          <span className="error-text">{labels.passwordHint}</span>
        ) : null}
      </label>
      <button className="button-primary" disabled={isSubmitting} type="submit">
        {mode === "login" ? labels.loginAction : labels.registerAction}
        <ArrowRight size={16} />
      </button>
    </form>
  );
}
