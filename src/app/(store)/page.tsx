import type { Metadata } from "next";
import {
  ArrowRight,
  Facebook,
  Headphones,
  Instagram,
  MessageCircle,
  Palette,
  ShieldCheck,
  Truck
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { TikTokIcon } from "@/components/brand-icons";
import {
  FACEBOOK_URL,
  INSTAGRAM_URL,
  TIKTOK_URL,
  ZALO_URL
} from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sukajan Order",
  description:
    "Hơn 4 năm tuyển chọn Sukajan và streetwear, giao hàng 7-10 ngày với tư vấn trực tiếp."
};

export default async function HomePage() {
  const t = await getTranslations("home");
  const common = await getTranslations("common");
  const showcasedProducts = [
    {
      image: "/sukajan/SukajanNo1-cropped.jpg",
      name: t("showcaseTigerBlack"),
      alt: t("showcaseTigerBlackAlt")
    },
    {
      image: "/sukajan/SukajanNo2-cropped.jpg",
      name: t("showcaseDragonPurple"),
      alt: t("showcaseDragonPurpleAlt")
    },
    {
      image: "/sukajan/SukajanNo3-cropped.jpg",
      name: t("showcaseTigerIvory"),
      alt: t("showcaseTigerIvoryAlt")
    }
  ];
  const benefits = [
    {
      icon: ShieldCheck,
      number: "01",
      title: t("qualityTitle"),
      body: t("qualityBody")
    },
    {
      icon: Palette,
      number: "02",
      title: t("styleTitle"),
      body: t("styleBody")
    },
    {
      icon: Truck,
      number: "03",
      title: t("deliveryTitle"),
      body: t("deliveryBody")
    },
    {
      icon: Headphones,
      number: "04",
      title: t("supportTitle"),
      body: t("supportBody")
    }
  ];
  const steps = Array.from({ length: 6 }, (_, index) => ({
    number: String(index + 1).padStart(2, "0"),
    title: t(`step${index + 1}Title`),
    body: t(`step${index + 1}Body`)
  }));

  return (
    <>
      <section className="relative isolate min-h-[calc(100svh-4.5rem)] overflow-hidden bg-[#11100e] text-white">
        <div className="absolute inset-y-0 right-0 w-full sm:w-[62%]">
          <Image
            alt="Áo Sukajan thêu hổ và phượng được tuyển chọn bởi random.phitruong"
            className="object-cover object-center"
            fill
            priority
            sizes="(max-width: 640px) 100vw, 62vw"
            src="/sukajan/SukajanHero-cropped.jpg"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#11100e] via-[#11100e]/90 to-[#11100e]/15" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#11100e] via-transparent to-transparent sm:hidden" />
        <div className="absolute inset-0 opacity-15 [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:64px_64px]" />

        <div className="container-shell relative flex min-h-[calc(100svh-4.5rem)] items-end py-10 sm:items-center sm:py-16">
          <div className="w-full max-w-4xl min-w-0">
            <div className="flex items-center gap-3">
              <span className="h-px w-10 shrink-0 bg-[#d64b3d]" />
              <p className="eyebrow min-w-0 text-white/65">{t("eyebrow")}</p>
            </div>

            <p className="mt-6 break-words text-[clamp(2.7rem,10vw,7.5rem)] font-black leading-[0.82] tracking-[-0.075em]">
              RANDOM.
              <br />
              PHITRUONG
            </p>

            <h1 className="mt-7 max-w-2xl text-xl font-bold leading-tight tracking-[-0.03em] text-white sm:text-3xl">
              {t("title")}
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-white/70 sm:text-base sm:leading-7">
              {t("subtitle")}
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                className="button-primary w-full border-white bg-white text-black hover:border-[#a72b1f] hover:bg-[#a72b1f] hover:text-white sm:w-auto"
                href="/shop"
              >
                {common("viewShop")}
                <ArrowRight size={17} />
              </Link>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/65">
                {t("trustLine")}
              </p>
            </div>
          </div>
        </div>

        <div className="absolute right-5 top-5 hidden items-center gap-4 lg:flex">
          <span className="vertical-label font-jp text-xs tracking-[0.4em] text-white/45">
            スカジャン
          </span>
          <div className="grid size-24 place-items-center rounded-full border border-white/30">
            <div className="relative size-16 overflow-hidden rounded-full bg-white">
              <Image
                alt="random.phitruong logo"
                className="object-contain"
                fill
                sizes="64px"
                src="/truongphistore/android-chrome-192x192.png"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-black/15 bg-[#a72b1f] text-white">
        <div className="container-shell grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 divide-x divide-y divide-white/20 md:divide-x-0 md:divide-y-0">
          {[
            ["4+", t("yearsLabel")],
            ["98K", t("instagramLabel")],
            ["43K", t("tiktokLabel")],
            ["7–10", t("deliveryLabel")]
          ].map(([value, label], index) => (
            <div
              className={`min-w-0 px-4 py-6 sm:px-6 ${index % 2 === 1 ? "md:border-l md:border-white/20" : ""} ${index > 1 ? "md:border-t md:border-white/20" : ""}`}
              key={label}
            >
              <p className="text-3xl font-black tracking-[-0.05em] sm:text-4xl">
                {value}
              </p>
              <p className="mt-2 break-words text-[0.62rem] font-bold uppercase leading-4 tracking-[0.13em] text-white/65">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="paper-texture border-b border-black/15">
        <div className="container-shell grid gap-10 py-20 md:grid-cols-[0.65fr_1.35fr] md:py-28">
          <div className="min-w-0">
            <p className="eyebrow text-[#a72b1f]">{t("introTitle")}</p>
            <p className="mt-6 font-jp text-5xl font-black text-black/10 sm:text-7xl">
              一期一会
            </p>
          </div>
          <p className="min-w-0 max-w-3xl text-2xl font-bold leading-[1.18] tracking-[-0.035em] sm:text-4xl">
            {t("introBody")}
          </p>
        </div>
      </section>

      <section className="container-shell py-20 md:py-28">
        <header className="grid gap-5 md:grid-cols-2 md:items-end">
          <div>
            <p className="eyebrow text-[#a72b1f]">{t("whyEyebrow")}</p>
            <h2 className="mt-4 max-w-3xl text-4xl font-black leading-[0.98] tracking-[-0.05em] sm:text-6xl">
              {t("whyTitle")}
            </h2>
          </div>
          <p className="justify-self-start font-jp text-6xl font-black text-black/10 md:justify-self-end md:text-8xl">
            約束
          </p>
        </header>

        <div className="mt-12 grid border-l border-t border-black/20 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {benefits.map(({ icon: Icon, number, title, body }) => (
            <article
              className="group min-w-0 border-b border-r border-black/20 p-6 transition-colors hover:bg-[#11100e] hover:text-white sm:p-7"
              key={number}
            >
              <div className="flex items-start justify-between gap-4">
                <Icon className="text-[#a72b1f]" size={25} strokeWidth={1.7} />
                <span className="text-xs font-black tracking-[0.16em] text-black/35 group-hover:text-white/35">
                  {number}
                </span>
              </div>
              <h3 className="mt-12 text-xl font-black leading-tight">{title}</h3>
              <p className="mt-4 text-sm leading-6 text-zinc-600 group-hover:text-white/60">
                {body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-black/15 bg-[#e5e0d6]">
        <div className="container-shell py-20 md:py-28">
          <div className="mb-10 flex items-end justify-between gap-5">
            <div>
              <p className="eyebrow text-[#a72b1f]">Selection · 選集</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-5xl">
                {t("featured")}
              </h2>
            </div>
            <Link
              className="hidden shrink-0 text-xs font-bold uppercase tracking-[0.12em] hover:text-[#a72b1f] sm:block"
              href="/shop"
            >
              {common("shop")} →
            </Link>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {showcasedProducts.map((product, index) => (
              <article className="group min-w-0" key={product.image}>
                <div className="relative aspect-[4/5] overflow-hidden bg-zinc-300">
                  <Image
                    alt={product.alt}
                    className="object-cover object-center transition duration-700 group-hover:scale-[1.025]"
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    src={product.image}
                  />
                  <span className="absolute left-3 top-3 bg-[#11100e] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white">
                    Selection 0{index + 1}
                  </span>
                </div>
                <div className="border-x border-b border-black/15 bg-white p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a72b1f]">
                    {t("showcaseLabel")}
                  </p>
                  <h3 className="mt-2 text-xl font-black leading-tight">
                    {product.name}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-zinc-600">
                    {t("showcasePriceNote")}
                  </p>
                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <a
                      className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#11100e] px-3 text-[10px] font-bold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#a72b1f]"
                      href={ZALO_URL}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <MessageCircle size={15} />
                      Zalo
                    </a>
                    <a
                      className="inline-flex min-h-11 items-center justify-center gap-2 border border-black bg-white px-3 text-[10px] font-bold uppercase tracking-[0.08em] text-black transition-colors hover:bg-[#1877f2] hover:text-white"
                      href={FACEBOOK_URL}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <Facebook size={15} />
                      Facebook
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#11100e] py-20 text-white md:py-28">
        <span className="pointer-events-none absolute -right-8 -top-24 font-jp text-[16rem] font-black text-white/[0.035]">
          道
        </span>
        <div className="container-shell relative">
          <div className="grid gap-6 md:grid-cols-[0.8fr_1.2fr] md:items-end">
            <p className="eyebrow text-[#d64b3d]">{t("processEyebrow")}</p>
            <h2 className="max-w-4xl text-4xl font-black leading-[1.02] tracking-[-0.05em] sm:text-6xl">
              {t("processTitle")}
            </h2>
          </div>

          <ol className="mt-14 grid border-l border-t border-white/15 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {steps.map((step) => (
              <li
                className="min-w-0 border-b border-r border-white/15 p-6 sm:p-8"
                key={step.number}
              >
                <span className="font-jp text-4xl font-black text-[#d64b3d]">
                  {step.number}
                </span>
                <h3 className="mt-8 text-xl font-black">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/55">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-shell grid gap-12 py-20 md:grid-cols-2 md:items-center md:py-28">
        <div className="min-w-0">
          <p className="eyebrow text-[#a72b1f]">Social diary · 日記</p>
          <h2 className="mt-4 text-4xl font-black leading-[1.02] tracking-[-0.05em] sm:text-6xl">
            {t("socialTitle")}
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-6 text-zinc-600">
            {t("socialBody")}
          </p>
        </div>
        <div className="grid min-w-0">
          <a
            className="flex min-w-0 items-center justify-between gap-4 border-t border-black p-5 font-bold hover:bg-[#11100e] hover:text-white"
            href={INSTAGRAM_URL}
            rel="noreferrer"
            target="_blank"
          >
            <span className="flex min-w-0 items-center gap-3">
              <Instagram className="shrink-0" />
              <span>Instagram</span>
            </span>
            <span className="truncate text-sm">@random.phitruong4</span>
          </a>
          <a
            className="flex min-w-0 items-center justify-between gap-4 border-y border-black p-5 font-bold hover:bg-[#11100e] hover:text-white"
            href={TIKTOK_URL}
            rel="noreferrer"
            target="_blank"
          >
            <span className="flex min-w-0 items-center gap-3">
              <TikTokIcon className="shrink-0" />
              <span>TikTok</span>
            </span>
            <span className="truncate text-sm">@random.phitruong</span>
          </a>
        </div>
      </section>
    </>
  );
}
