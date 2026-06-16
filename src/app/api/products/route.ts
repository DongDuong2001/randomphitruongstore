import { err, handlePrismaError, ok, zodDetails } from "@/lib/api-response";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/prisma";
import { productInputSchema } from "@/lib/validations";

export async function GET() {
  try {
    const products = await getPrisma().product.findMany({
      where: { isActive: true, stockStatus: "IN_STOCK" },
      include: { images: { orderBy: { sortOrder: "asc" } } },
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

  const { images, ...data } = parsed.data;
  try {
    const product = await getPrisma().product.create({
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
    return ok(product, 201);
  } catch (error) {
    return handlePrismaError(error);
  }
}
