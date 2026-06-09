import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { BRAND_NAME, SITE_URL } from "@/lib/constants";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
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
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
