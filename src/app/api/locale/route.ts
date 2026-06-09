import { NextResponse } from "next/server";
import { locales } from "@/i18n/request";

export async function POST(request: Request) {
  const body = (await request.json()) as { locale?: string };
  if (!locales.includes(body.locale as (typeof locales)[number])) {
    return NextResponse.json({ error: "Unsupported locale" }, { status: 400 });
  }

  const response = NextResponse.json({ locale: body.locale });
  response.cookies.set("locale", body.locale!, {
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365
  });
  return response;
}
