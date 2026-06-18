import { err, handlePrismaError, ok } from "@/lib/api-response";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/prisma";
import { updateProductInquiryStatus } from "@/lib/product-inquiry";
import { orderRequestStatusSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return err("Unauthorized", 401);
  }
  const parsed = orderRequestStatusSchema.safeParse(await request.json());
  if (!parsed.success) {
    return err("Invalid status", 400);
  }
  const { id } = await context.params;
  try {
    const orderRequest = await updateProductInquiryStatus(
      getPrisma(),
      id,
      parsed.data.status
    );
    return ok(orderRequest);
  } catch (error) {
    return handlePrismaError(error);
  }
}
