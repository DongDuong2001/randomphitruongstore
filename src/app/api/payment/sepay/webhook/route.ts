import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { parseSePayIpn, verifySePayIpnSecret } from "@/lib/sepay";
import {
  SePaySettlementError,
  settleSePayPayment
} from "@/lib/sepay-settlement";

export async function POST(request: Request) {
  if (!verifySePayIpnSecret(request.headers)) {
    console.error("[SePay IPN] Invalid X-Secret-Key");
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let payload;
  try {
    payload = parseSePayIpn(await request.json());
  } catch {
    return NextResponse.json({ success: false, error: "Invalid IPN payload" }, { status: 400 });
  }

  try {
    await settleSePayPayment({ prisma: getPrisma(), payload });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof SePaySettlementError) {
      console.error(`[SePay IPN] ${error.message}`);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error("[SePay IPN] Processing failed", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
