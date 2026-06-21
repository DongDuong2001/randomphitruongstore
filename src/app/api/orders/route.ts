import { err, handlePrismaError, ok, zodDetails } from "@/lib/api-response";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { CheckoutOrderError, createCheckoutOrder } from "@/lib/checkout-order";
import { normalizeEmail } from "@/lib/customer-account";
import { orderNumber } from "@/lib/format";
import { getPrisma } from "@/lib/prisma";
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
    const body = await request.json();
    const parsed = orderInputSchema.safeParse(body);
    if (!parsed.success) {
      return err("Invalid order data", 400, zodDetails(parsed.error));
    }

    const input = parsed.data;
    const supabase = await getSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    const userEmail = normalizeEmail(user?.email);

    const order = await createCheckoutOrder({
      prisma: getPrisma(),
      input,
      userEmail,
      generateOrderNumber: orderNumber
    });

    return ok(order, 201);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return err("Invalid JSON payload", 400);
    }
    if (error instanceof CheckoutOrderError) {
      return err(error.message, error.status);
    }
    return handlePrismaError(error);
  }
}
