import { err, handlePrismaError, ok, zodDetails } from "@/lib/api-response";
import { getCurrentAdmin } from "@/lib/admin-auth";
import {
  OrderLifecycleError,
  updateAdminOrderLifecycle
} from "@/lib/order-lifecycle";
import { getPrisma } from "@/lib/prisma";
import { orderStatusSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: RouteContext) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return err("Unauthorized", 401);
  }
  const { id } = await context.params;
  try {
    const order = await getPrisma().order.findUnique({
      where: { id },
      include: {
        customer: true,
        items: { include: { product: true, productVariant: true } },
        payments: { orderBy: { createdAt: "asc" } },
        shippingAddress: true,
        statusHistory: { orderBy: { createdAt: "desc" } }
      }
    });
    if (!order) {
      return err("Order not found", 404);
    }
    return ok(order);
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return err("Unauthorized", 401);
  }
  const parsed = orderStatusSchema.safeParse(await request.json());
  if (!parsed.success) {
    return err("Invalid status", 400, zodDetails(parsed.error));
  }
  const { id } = await context.params;
  try {
    const order = await updateAdminOrderLifecycle({
      prisma: getPrisma(),
      orderId: id,
      status: parsed.data.status,
      note: parsed.data.note,
      adminId: admin.id
    });
    return ok(order);
  } catch (error) {
    if (error instanceof OrderLifecycleError) {
      return err(error.message, error.status);
    }
    return handlePrismaError(error);
  }
}
