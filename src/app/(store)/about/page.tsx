import type { Metadata } from "next";
import { ArrowUpRight, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: "Hành trình của Phi Trường",
  description:
    "Câu chuyện từ năm 2022 và cách random.phitruong tuyển chọn Sukajan, bomber, hoodie và streetwear."
};

export default async function AboutPage() {
  const t = await getTranslations("about");
  const common = await getTranslations("common");

  return (
    <div className="overflow-hidden">
      <section className="paper-texture border-b border-black/15">
        <div className="container-shell grid gap-12 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-[#a72b1f]" />
              <p className="eyebrow text-[#a72b1f]">{t("eyebrow")}</p>
            </div>
            <h1 className="mt-6 max-w-4xl font-black leading-[0.94] tracking-[-0.055em]">
              <span className="block text-[clamp(2.7rem,7vw,6.2rem)]">
                <span className="block">RANDOM.</span>
                <span className="block">PHITRUONG</span>
              </span>
              <span className="mt-3 block text-[clamp(1.9rem,4.5vw,4rem)] text-black/75">
                {t("journeyTitle")}
              </span>
            </h1>
            <p className="mt-8 border-l-2 border-[#a72b1f] pl-5 text-xl font-bold leading-8">
              {t("lead")}
            </p>
          </div>

          <div className="relative min-h-[28rem] lg:min-h-[42rem]">
            <div className="absolute inset-0 translate-x-4 translate-y-4 border border-black/20" />
            <div className="absolute inset-0 overflow-hidden bg-[#d8d3c9]">
              <Image
                alt="Người mẫu mặc áo Sukajan thêu rồng màu đen đỏ"
                className="object-cover object-center"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 45vw"
                src="/sukajan/SukajanAbout.jpg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-5 p-6 text-white">
                <div>
                  <p className="font-jp text-4xl font-black">黒龍</p>
                  <p className="mt-2 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-white/60">
                    {t("imageCaption")}
                  </p>
                </div>
                <p className="text-5xl font-black tracking-[-0.06em]">2022</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-shell py-20 md:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.55fr_1.45fr]">
          <div>
            <p className="eyebrow text-[#a72b1f]">The story · 物語</p>
            <p className="mt-5 font-jp text-7xl font-black text-black/10">四年</p>
          </div>
          <div className="grid gap-10 text-lg leading-8 text-zinc-700 md:grid-cols-2">
            <p>{t("story1")}</p>
            <p>{t("story2")}</p>
            <p className="border-l border-black/20 pl-6 font-bold text-black md:col-span-2 md:text-2xl md:leading-10">
              {t("story3")}
            </p>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-2 border-l border-t border-black/20 md:grid-cols-4">
          {[
            ["4+", "Years"],
            ["98K", "Instagram"],
            ["43K", "TikTok"],
            ["7–10", "Days"]
          ].map(([value, label]) => (
            <div className="border-b border-r border-black/20 p-5 sm:p-8" key={label}>
              <p className="text-3xl font-black tracking-[-0.05em] sm:text-5xl">
                {value}
              </p>
              <p className="mt-3 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-zinc-500">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#a72b1f] text-white">
        <div className="container-shell grid gap-12 py-20 lg:grid-cols-2 lg:items-center lg:py-28">
          <div className="min-w-0">
            <p className="eyebrow text-white/60">Selection standard</p>
            <h2 className="mt-4 text-4xl font-black leading-[1.02] tracking-[-0.05em] sm:text-6xl">
              {t("selectionTitle")}
            </h2>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
              {t("selectionBody")}
            </p>
          </div>
          <div className="grid border-l border-t border-white/25 sm:grid-cols-2">
            {["Sukajan", "Bomber jacket", "Hoodie", "T-shirt"].map((item) => (
              <div
                className="flex min-w-0 items-center gap-3 border-b border-r border-white/25 p-5"
                key={item}
              >
                <Check className="shrink-0" size={18} />
                <span className="font-bold">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-shell py-20 md:py-28">
        <div className="grid gap-10 border-y border-black py-10 md:grid-cols-[1.2fr_0.8fr] md:items-end">
          <div>
            <p className="eyebrow text-[#a72b1f]">Direct consultation</p>
            <h2 className="mt-4 max-w-3xl text-4xl font-black leading-[1.02] tracking-[-0.05em] sm:text-6xl">
              {t("promiseTitle")}
            </h2>
            <p className="mt-6 max-w-3xl text-sm leading-7 text-zinc-600 sm:text-base">
              {t("promiseBody")}
            </p>
          </div>
          <Link
            className="button-primary w-full md:w-auto md:justify-self-end"
            href="/contact"
          >
            {common("contact")}
            <ArrowUpRight size={17} />
          </Link>
        </div>
      </section>
    </div>
  );
}
