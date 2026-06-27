import { err, handlePrismaError, ok, zodDetails } from "@/lib/api-response";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { buildProductCatalogWrite } from "@/lib/product-catalog";
import { getPrisma } from "@/lib/prisma";
import { revalidatePublicCatalog } from "@/lib/public-catalog";
import { productInputSchema } from "@/lib/validations";

export async function GET() {
  try {
    const products = await getPrisma().product.findMany({
      where: { isActive: true, stockStatus: "IN_STOCK" },
      include: {
        categoryRecord: true,
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        variants: { orderBy: [{ size: "asc" }, { colorVi: "asc" }] },
        sizeCharts: { orderBy: { size: "asc" } }
      },
      orderBy: { createdAt: "desc" }
    });
    return ok(products);
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return err("Unauthorized", 401);
  }

  const parsed = productInputSchema.safeParse(await request.json());
  if (!parsed.success) {
    return err("Invalid product data", 400, zodDetails(parsed.error));
  }

  const catalog = buildProductCatalogWrite(parsed.data);
  try {
    const product = await getPrisma().product.create({
      data: {
        ...catalog.productData,
        images: { create: catalog.images },
        variants: { create: catalog.variants },
        sizeCharts: { create: catalog.sizeCharts }
      },
      include: {
        categoryRecord: true,
        images: { orderBy: { sortOrder: "asc" } },
        variants: { orderBy: [{ size: "asc" }, { colorVi: "asc" }] },
        sizeCharts: { orderBy: { size: "asc" } }
      }
    });
    revalidatePublicCatalog(product.slug);
    return ok(product, 201);
  } catch (error) {
    return handlePrismaError(error);
  }
}
