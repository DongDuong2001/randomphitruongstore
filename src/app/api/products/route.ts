import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/prisma";
import { productInputSchema } from "@/lib/validations";

export async function GET() {
  const products = await getPrisma().product.findMany({
    where: { isActive: true },
    include: { images: { orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(products);
}

export async function POST(request: Request) {
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

  const { images, ...data } = parsed.data;
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

  return NextResponse.json(product, { status: 201 });
}
