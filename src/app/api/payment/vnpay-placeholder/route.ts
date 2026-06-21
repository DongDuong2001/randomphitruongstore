import { paymentPlaceholderResponse } from "@/lib/payment-placeholder";

export async function GET(request: Request) {
  return paymentPlaceholderResponse(request, "VNPay");
}
