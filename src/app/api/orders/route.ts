import { err, handlePrismaError, ok, zodDetails } from "@/lib/api-response";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  orderCurrencySnapshotFor,
  resolveEnabledCurrency
} from "@/lib/currency";
import { CheckoutOrderError, createCheckoutOrder } from "@/lib/checkout-order";
import { orderNumber } from "@/lib/format";
import { setGuestOrderAccessCookies } from "@/lib/guest-order-cookie";
import {
  getCurrencySettings,
  resolveRequestCurrency
} from "@/lib/currency-settings";
import { getPrisma } from "@/lib/prisma";
import { rateLimitPolicies, rateLimitRequest } from "@/lib/rate-limit";
import { orderInputSchema } from "@/lib/validations";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return err("Unauthorized", 401);
  }

  try {
    const orders = await getPrisma().order.findMany({
      include: { customer: true, items: { include: { product: true } } },
      orderBy: { createdAt: "desc" }
    });
    return ok(orders);
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function POST(request: Request) {
  try {
    const limited = await rateLimitRequest(request, rateLimitPolicies.checkoutOrderIp);
    if (limited) return limited;

    const body = await request.json();
    const parsed = orderInputSchema.safeParse(body);
    if (!parsed.success) {
      return err("Invalid order data", 400, zodDetails(parsed.error));
    }

    const input = parsed.data;
    const currencySettings = await getCurrencySettings();
    const requestCurrency =
      input.selectedCurrency ??
      (await resolveRequestCurrency(currencySettings));
    const displayCurrency = resolveEnabledCurrency(
      requestCurrency,
      currencySettings
    );
    const currencySnapshot = orderCurrencySnapshotFor(
      displayCurrency,
      currencySettings
    );
    const supabase = await getSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    const order = await createCheckoutOrder({
      prisma: getPrisma(),
      input,
      userEmail: user?.email,
      supabaseUserId: user?.id,
      generateOrderNumber: orderNumber,
      currencySnapshot
    });

    const { trackingToken, ...responseOrder } = order as {
      id: string;
      orderNumber: string;
      trackingToken: string;
    } & Record<string, unknown>;
    await setGuestOrderAccessCookies({
      orderId: responseOrder.id,
      orderNumber: responseOrder.orderNumber,
      token: trackingToken
    });

    return ok(responseOrder, 201);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return err("Invalid JSON payload", 400);
    }
    if (error instanceof CheckoutOrderError) {
      return err(error.message, error.status);
    }
    if (
      error instanceof Error &&
      error.message.includes("USD display requires")
    ) {
      return err("USD pricing is not available", 409);
    }
    return handlePrismaError(error);
  }
}
