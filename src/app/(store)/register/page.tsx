import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Customer register",
  description: "Frontend preview registration for customer checkout."
};

export default async function RegisterPage() {
  const t = await getTranslations("auth");

  return (
    <div className="paper-texture">
      <div className="container-shell grid min-h-[70vh] place-items-center py-14">
        <section className="w-full max-w-lg">
          <p className="eyebrow text-[#a72b1f]">{t("eyebrow")}</p>
          <h1 className="mt-3 text-5xl font-black tracking-[-0.05em]">{t("registerTitle")}</h1>
          <AuthForm
            mode="register"
            labels={{
              email: t("email"),
              password: t("password"),
              fullName: t("fullName"),
              invalidEmail: t("invalidEmail"),
              passwordHint: t("passwordHint"),
              loginAction: t("loginAction"),
              registerAction: t("registerAction")
            }}
          />
          <Link
            className="mt-6 inline-block text-sm font-bold text-[#a72b1f] hover:text-black"
            href="/login"
          >
            {t("registerSwitch")}
          </Link>
        </section>
      </div>
    </div>
  );
}
