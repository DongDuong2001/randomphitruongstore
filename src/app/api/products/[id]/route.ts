import { err, handlePrismaError, ok, zodDetails } from "@/lib/api-response";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  buildProductCatalogWrite,
  buildProductVariantSyncPlan
} from "@/lib/product-catalog";
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
  const catalog = buildProductCatalogWrite(parsed.data);
  try {
    const product = await getPrisma().$transaction(async (prisma) => {
      const existingVariants = await prisma.productVariant.findMany({
        where: { productId: id },
        select: {
          id: true,
          size: true,
          colorVi: true,
          _count: { select: { orderItems: true } }
        }
      });
      const variantPlan = buildProductVariantSyncPlan({
        existingVariants: existingVariants.map((variant) => ({
          id: variant.id,
          size: variant.size,
          colorVi: variant.colorVi,
          orderItemCount: variant._count.orderItems
        })),
        nextVariants: catalog.variants
      });

      await prisma.productImage.deleteMany({ where: { productId: id } });
      await prisma.sizeChart.deleteMany({ where: { productId: id } });
      await prisma.product.update({
        where: { id },
        data: {
          ...catalog.productData,
          images: { create: catalog.images },
          sizeCharts: { create: catalog.sizeCharts }
        }
      });

      for (const variantUpdate of variantPlan.update) {
        await prisma.productVariant.update({
          where: { id: variantUpdate.id },
          data: variantUpdate.data
        });
      }

      if (variantPlan.deleteIds.length > 0) {
        await prisma.productVariant.deleteMany({
          where: { id: { in: variantPlan.deleteIds } }
        });
      }

      for (const variant of variantPlan.create) {
        await prisma.productVariant.create({
          data: {
            productId: id,
            ...variant
          }
        });
      }

      return prisma.product.findUniqueOrThrow({
        where: { id },
        include: {
          categoryRecord: true,
          images: { orderBy: { sortOrder: "asc" } },
          variants: { orderBy: [{ size: "asc" }, { colorVi: "asc" }] },
          sizeCharts: { orderBy: { size: "asc" } }
        }
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
