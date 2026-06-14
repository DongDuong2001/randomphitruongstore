import type { Metadata } from "next";
import { Be_Vietnam_Pro, Noto_Serif_JP } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { CustomCursor } from "@/components/custom-cursor";
import { BRAND_NAME, SITE_URL } from "@/lib/constants";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800", "900"]
});

const notoSerifJp = Noto_Serif_JP({
  subsets: ["latin"],
  variable: "--font-jp",
  weight: ["500", "700", "900"]
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  manifest: "/truongphistore/site.webmanifest",
  icons: {
    icon: [
      {
        url: "/truongphistore/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png"
      },
      {
        url: "/truongphistore/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png"
      }
    ],
    shortcut: "/truongphistore/favicon.ico",
    apple: [
      {
        url: "/truongphistore/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png"
      }
    ]
  },
  title: {
    default: `${BRAND_NAME} | Premium streetwear order`,
    template: `%s | ${BRAND_NAME}`
  },
  description:
    "Premium streetwear order store in Vietnam for Sukajan, bomber jackets, hoodies and seasonal pieces.",
  openGraph: {
    type: "website",
    siteName: BRAND_NAME,
    title: `${BRAND_NAME} | Premium streetwear order`,
    description:
      "Curated streetwear orders with delivery in 7-10 days and international consultation.",
    url: SITE_URL
  },
  twitter: {
    card: "summary_large_image"
  }
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html data-scroll-behavior="smooth" lang={locale}>
      <body
        className={`${beVietnamPro.className} ${beVietnamPro.variable} ${notoSerifJp.variable}`}
      >
        <NextIntlClientProvider messages={messages}>
          {children}
          <CustomCursor />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
