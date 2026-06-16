import { err, handlePrismaError, ok, zodDetails } from "@/lib/api-response";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/prisma";
import { productInputSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return err("Unauthorized", 401);
  }

  const parsed = productInputSchema.safeParse(await request.json());
  if (!parsed.success) {
    return err("Invalid product data", 400, zodDetails(parsed.error));
  }

  const { id } = await context.params;
  const { images, ...data } = parsed.data;
  try {
    const product = await getPrisma().$transaction(async (prisma) => {
      await prisma.productImage.deleteMany({ where: { productId: id } });
      return prisma.product.update({
        where: { id },
        data: {
          ...data,
          images: {
            create: images.map((url, index) => ({
              url,
              altVi: data.nameVi,
              altEn: data.nameEn,
              sortOrder: index
            }))
          }
        },
        include: { images: { orderBy: { sortOrder: "asc" } } }
      });
    });
    return ok(product);
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return err("Unauthorized", 401);
  }

  const { id } = await context.params;
  try {
    const orderItemCount = await getPrisma().orderItem.count({
      where: { productId: id }
    });

    if (orderItemCount > 0) {
      const product = await getPrisma().product.update({
        where: { id },
        data: { isActive: false }
      });
      return ok({ product, archived: true });
    }

    await getPrisma().product.delete({ where: { id } });
    return ok({ archived: false });
  } catch (error) {
    return handlePrismaError(error);
  }
}
