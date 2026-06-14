import type { Metadata } from "next";
import {
  Banknote,
  Instagram,
  RefreshCcw,
  Truck,
  WalletCards
} from "lucide-react";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { ContactForm } from "@/components/contact-form";
import { FAQAccordion } from "@/components/faq-accordion";
import { TikTokIcon, ZaloIcon } from "@/components/brand-icons";
import type { Locale } from "@/i18n/request";
import {
  INSTAGRAM_URL,
  TIKTOK_URL,
  ZALO_PHONE,
  ZALO_URL
} from "@/lib/constants";

export const metadata: Metadata = {
  title: "Liên hệ, chính sách và FAQ",
  description:
    "Liên hệ random.phitruong và xem chính sách đặt cọc, giao hàng, đổi trả cùng câu hỏi thường gặp."
};

const faq = {
  vi: [
    [
      "Hàng có phải hàng chính hãng không?",
      "Có. Hàng được chọn từ các đơn vị cung cấp uy tín và được shop kiểm tra trước khi nhận. Shop không kinh doanh hàng rep hoặc hàng fake."
    ],
    [
      "Tôi có thể xem hàng thực tế trước khi mua không?",
      "Có. Video hàng thực tế được đăng thường xuyên trên TikTok và Instagram. Nếu cần ảnh chi tiết hơn, bạn có thể nhắn trực tiếp."
    ],
    [
      "Nếu hàng về không đúng như xác nhận thì sao?",
      "Nếu sản phẩm lỗi hoặc sai màu/size so với đơn đã xác nhận, shop sẽ hỗ trợ đổi miễn phí hoặc hoàn tiền theo tình trạng thực tế."
    ],
    [
      "Shop có giao toàn quốc không?",
      "Có. Shop giao toàn quốc qua đơn vị vận chuyển phù hợp. Phí giao hàng được tính theo khu vực."
    ],
    [
      "Đặt hàng như thế nào?",
      "Bạn có thể chọn sản phẩm trên website rồi nhắn trực tiếp qua Instagram hoặc Zalo. Phi Trường sẽ tư vấn và xác nhận đơn."
    ],
    [
      "Có thể order màu hoặc size cụ thể không?",
      "Tùy từng sản phẩm. Shop sẽ kiểm tra khả năng cung cấp trước khi xác nhận. Sau khi đã chốt và đặt với nhà cung cấp, size/màu không thể thay đổi."
    ],
    [
      "Hàng về mất bao lâu?",
      "Trung bình 7–10 ngày làm việc kể từ khi xác nhận cọc. Thời gian có thể chênh lệch nhẹ do vận chuyển quốc tế và shop sẽ cập nhật."
    ],
    [
      "Tôi có thể hủy đơn sau khi đã cọc không?",
      "Tiền cọc không được hoàn lại nếu khách hủy sau khi shop đã đặt hàng. Nếu shop hết hàng hoặc hàng lỗi từ nhà cung cấp, shop hoàn cọc 100%."
    ],
    [
      "Shop có giao quốc tế không?",
      "Có. Đơn đi Hàn Quốc, Đài Loan và Nhật Bản được tư vấn trực tiếp qua Zalo để xác nhận phí vận chuyển và yêu cầu hải quan."
    ]
  ],
  en: [
    [
      "Are the products authentic?",
      "Yes. Products come from trusted suppliers and are inspected by the shop. We do not sell replicas or counterfeit goods."
    ],
    [
      "Can I see the actual product before buying?",
      "Yes. Real product videos are posted regularly on TikTok and Instagram. Message directly for additional detail photos."
    ],
    [
      "What if the item differs from the confirmed order?",
      "If an item is defective or has the wrong confirmed color/size, the shop will arrange a free exchange or refund based on the case."
    ],
    [
      "Do you deliver across Vietnam?",
      "Yes. Nationwide delivery is available through suitable carriers. Shipping cost depends on the destination."
    ],
    [
      "How do I place an order?",
      "Choose a product on the website, then message through Instagram or Zalo. Phi Truong will provide advice and confirm the order."
    ],
    [
      "Can I request a specific color or size?",
      "Availability depends on the product and is checked before confirmation. Size and color cannot be changed after the supplier order is placed."
    ],
    [
      "How long does delivery take?",
      "The average is 7–10 business days after deposit confirmation. International transit can vary slightly and updates will be provided."
    ],
    [
      "Can I cancel after paying the deposit?",
      "The deposit is non-refundable after the supplier order is placed. It is refunded in full if the shop cannot source the item or the supplier item is defective."
    ],
    [
      "Do you ship internationally?",
      "Yes. Korea, Taiwan and Japan orders are handled through direct Zalo consultation for shipping and customs requirements."
    ]
  ]
} as const;

export default async function ContactPage() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("contact");
  const policies = [
    {
      icon: Banknote,
      title: t("depositPolicy"),
      body: t("depositPolicyBody")
    },
    {
      icon: Truck,
      title: t("deliveryPolicy"),
      body: t("deliveryPolicyBody")
    },
    {
      icon: RefreshCcw,
      title: t("returnPolicy"),
      body: t("returnPolicyBody")
    },
    {
      icon: WalletCards,
      title: t("paymentPolicy"),
      body: t("paymentPolicyBody")
    }
  ];

  return (
    <div className="overflow-hidden">
      <section className="paper-texture border-b border-black/15">
        <div className="container-shell py-14 sm:py-20">
          <header className="max-w-4xl">
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-[#a72b1f]" />
              <p className="eyebrow text-[#a72b1f]">Direct support · 24/7</p>
            </div>
            <h1 className="mt-5 text-[clamp(2.8rem,8vw,6.8rem)] font-black leading-[0.9] tracking-[-0.065em]">
              {t("title")}
            </h1>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-zinc-600 sm:text-base">
              {t("subtitle")}
            </p>
          </header>

          <section className="mt-12 grid min-w-0 gap-10 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] xl:items-start">
            <div className="min-w-0 xl:sticky xl:top-28">
              <ContactForm
                labels={{
                  name: t("name"),
                  message: t("message"),
                  send: t("send")
                }}
              />
            </div>
            <div className="grid min-w-0 border-l border-t border-black/20 sm:grid-cols-2">
              <a
                className="group min-w-0 border-b border-r border-black/20 bg-[#11100e] p-6 text-white hover:bg-[#a72b1f]"
                href={ZALO_URL}
                rel="noreferrer"
                target="_blank"
              >
                <ZaloIcon size={24} />
                <p className="mt-10 font-black">Zalo</p>
                <p className="mt-1 break-all text-sm text-white/60 group-hover:text-white/75">
                  {ZALO_PHONE}
                </p>
              </a>
              <a
                aria-label="Scan Zalo QR to contact Đỗ Phi Trường"
                className="relative aspect-square w-full overflow-hidden border-b border-r border-black/20 bg-white p-4"
                href={ZALO_URL}
                rel="noreferrer"
                target="_blank"
              >
                <span className="relative block size-full">
                  <Image
                    alt="Zalo QR của Đỗ Phi Trường"
                    className="object-contain"
                    fill
                    sizes="(max-width: 640px) calc(100vw - 64px), 420px"
                    src="/zaloqr/zaloqr-code.png"
                    unoptimized
                  />
                </span>
              </a>
              <a
                className="min-w-0 border-b border-r border-black/20 bg-white p-6 hover:bg-[#11100e] hover:text-white"
                href={INSTAGRAM_URL}
                rel="noreferrer"
                target="_blank"
              >
                <Instagram />
                <p className="mt-10 font-black">Instagram</p>
                <p className="mt-1 truncate text-sm text-zinc-500">
                  @random.phitruong4
                </p>
              </a>
              <a
                className="min-w-0 border-b border-r border-black/20 bg-white p-6 hover:bg-[#11100e] hover:text-white"
                href={TIKTOK_URL}
                rel="noreferrer"
                target="_blank"
              >
                <TikTokIcon size={24} />
                <p className="mt-10 font-black">TikTok</p>
                <p className="mt-1 truncate text-sm text-zinc-500">
                  @random.phitruong
                </p>
              </a>
            </div>
          </section>
        </div>
      </section>

      <section className="container-shell py-20 md:py-28" id="policies">
        <header className="grid gap-5 md:grid-cols-2 md:items-end">
          <div>
            <p className="eyebrow text-[#a72b1f]">{t("policyEyebrow")}</p>
            <h2 className="mt-4 max-w-3xl text-4xl font-black leading-[1.02] tracking-[-0.05em] sm:text-6xl">
              {t("policyTitle")}
            </h2>
          </div>
          <p className="justify-self-start font-jp text-6xl font-black text-black/10 md:justify-self-end md:text-8xl">
            約束
          </p>
        </header>

        <div className="mt-12 grid border-l border-t border-black/20 md:grid-cols-2">
          {policies.map(({ icon: Icon, title, body }, index) => (
            <article
              className="min-w-0 border-b border-r border-black/20 p-6 sm:p-8"
              key={title}
            >
              <div className="flex items-start justify-between gap-5">
                <Icon className="text-[#a72b1f]" size={25} strokeWidth={1.7} />
                <span className="text-xs font-black tracking-[0.15em] text-black/30">
                  0{index + 1}
                </span>
              </div>
              <h3 className="mt-8 text-xl font-black">{title}</h3>
              <p className="mt-4 text-sm leading-7 text-zinc-600">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#11100e] py-20 text-white md:py-28">
        <div className="container-shell">
          <div className="grid gap-5 md:grid-cols-[0.7fr_1.3fr] md:items-end">
            <p className="eyebrow text-[#d64b3d]">FAQ · 質問</p>
            <h2 className="text-4xl font-black tracking-[-0.05em] sm:text-6xl">
              {t("faq")}
            </h2>
          </div>
          <div className="mt-12 border-t border-white/20 [&_button]:text-white [&_div]:border-white/20 [&_p]:text-white/60">
            <FAQAccordion
              items={faq[locale].map(([question, answer]) => ({
                question,
                answer
              }))}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
