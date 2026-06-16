import { NextResponse } from "next/server";
import { z } from "zod";
import { err } from "@/lib/api-response";
import { locales } from "@/i18n/request";

const localeSchema = z.object({
  locale: z.enum(locales)
});

export async function POST(request: Request) {
  const parsed = localeSchema.safeParse(await request.json());
  if (!parsed.success) {
    return err("Unsupported locale", 400);
  }

  const { locale } = parsed.data;
  const response = NextResponse.json({ success: true, data: { locale } });
  response.cookies.set("locale", locale, {
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365
  });
  return response;
}
