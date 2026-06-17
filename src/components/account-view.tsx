"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";

export function AccountView({ title }: { title: string }) {
  const t = useTranslations("account");
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="container-shell py-10 sm:py-16">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="size-8 animate-spin border-4 border-[#a72b1f] border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container-shell py-10 sm:py-16">
        <div className="max-w-lg mx-auto text-center">
          <div className="mx-auto size-12 text-zinc-400">!</div>
          <h1 className="mt-4 text-2xl font-black">{t("signInRequired")}</h1>
          <p className="mt-2 text-zinc-600">{t("signInRequiredBody")}</p>
          <Link className="button-primary mt-6 inline-block" href="/login">
            {t("signIn")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-shell py-10 sm:py-16">
      <header className="mb-10">
        <p className="eyebrow text-[#a72b1f]">{t("welcomeBack", { name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? t("customer") })}</p>
        <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] sm:text-5xl">{title}</h1>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <section>
          <h2 className="text-xl font-black">{t("myOrders")}</h2>
          <OrderList />
        </section>

        <section>
          <h2 className="text-xl font-black">{t("myConsultations")}</h2>
          <ConsultationList />
        </section>
      </div>

      <aside className="lg:hidden">
        <h2 className="text-xl font-black">{t("myConsultations")}</h2>
        <ConsultationList />
      </aside>
    </div>
  );
}

function OrderList() {
  const t = useTranslations("account");

  return (
    <div className="mt-4 border border-black/10 bg-white rounded-xl overflow-hidden">
      <div className="border-b border-black/10 px-4 py-3 text-sm font-bold uppercase tracking-[0.1em] text-zinc-600">
        {t("orderHistory")}
      </div>
      <OrderListSkeleton />
    </div>
  );
}

function ConsultationList() {
  const t = useTranslations("account");

  return (
    <div className="mt-4 border border-black/10 bg-white rounded-xl overflow-hidden">
      <div className="border-b border-black/10 px-4 py-3 text-sm font-bold uppercase tracking-[0.1em] text-zinc-600">
        {t("consultationHistory")}
      </div>
      <ConsultationListSkeleton />
    </div>
  );
}

function OrderListSkeleton() {
  return (
    <div className="divide-y divide-black/5">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="p-4 space-y-3 animate-pulse">
          <div className="h-4 bg-zinc-200 rounded w-1/4" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-4 bg-zinc-200 rounded" />
            <div className="h-4 bg-zinc-200 rounded" />
          </div>
        </div>
      ))}
      <div className="p-4 text-center text-zinc-500 text-sm">
        Loading orders...
      </div>
    </div>
  );
}

function ConsultationListSkeleton() {
  return (
    <div className="divide-y divide-black/5">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="p-4 space-y-3 animate-pulse">
          <div className="h-4 bg-zinc-200 rounded w-1/3" />
          <div className="h-4 bg-zinc-200 rounded w-1/2" />
        </div>
      ))}
      <div className="p-4 text-center text-zinc-500 text-sm">
        Loading consultations...
      </div>
    </div>
  );
}