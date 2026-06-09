import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

export const locales = ["vi", "en"] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const requestedLocale = cookieStore.get("locale")?.value;
  const locale: Locale = locales.includes(requestedLocale as Locale)
    ? (requestedLocale as Locale)
    : "vi";

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
