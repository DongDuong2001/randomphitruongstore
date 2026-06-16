import { err, handlePrismaError, ok } from "@/lib/api-response";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/prisma";
import { orderStatusSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return err("Unauthorized", 401);
  }
  const { id } = await context.params;
  try {
    const order = await getPrisma().order.findUnique({
      where: { id },
      include: { customer: true, items: { include: { product: true } } }
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
  if (!(await isAdminAuthenticated())) {
    return err("Unauthorized", 401);
  }
  const parsed = orderStatusSchema.safeParse(await request.json());
  if (!parsed.success) {
    return err("Invalid status", 400);
  }
  const { id } = await context.params;
  try {
    const order = await getPrisma().order.update({
      where: { id },
      data: { status: parsed.data.status }
    });
    return ok(order);
  } catch (error) {
    return handlePrismaError(error);
  }
}
