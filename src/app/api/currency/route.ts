import { NextResponse } from "next/server";
import { err } from "@/lib/api-response";
import {
  currencyCookieName,
  isCurrency,
  isCurrencyEnabled
} from "@/lib/currency";
import { getCurrencySettings } from "@/lib/currency-settings";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON payload", 400);
  }

  const currency =
    body && typeof body === "object" && "currency" in body
      ? (body as { currency: unknown }).currency
      : null;

  if (!isCurrency(currency)) {
    return err("Unsupported currency", 400);
  }

  const settings = await getCurrencySettings();
  if (!isCurrencyEnabled(currency, settings)) {
    return err("Currency is disabled", 400);
  }

  const response = NextResponse.json({
    success: true,
    data: { currency, settings }
  });
  response.cookies.set(currencyCookieName, currency, {
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365
  });
  return response;
}
