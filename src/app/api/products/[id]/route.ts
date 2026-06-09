import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/prisma";
import { productInputSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = productInputSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid product", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { id } = await context.params;
  const { images, ...data } = parsed.data;
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

  return NextResponse.json(product);
}

export async function DELETE(_: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const orderItemCount = await getPrisma().orderItem.count({
    where: { productId: id }
  });

  if (orderItemCount > 0) {
    const product = await getPrisma().product.update({
      where: { id },
      data: { isActive: false }
    });
    return NextResponse.json({ product, archived: true });
  }

  await getPrisma().product.delete({ where: { id } });
  return NextResponse.json({ ok: true, archived: false });
}
