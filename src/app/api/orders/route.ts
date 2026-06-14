import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { orderNumber } from "@/lib/format";
import { getPrisma } from "@/lib/prisma";
import { orderInputSchema } from "@/lib/validations";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await getPrisma().order.findMany({
    include: { customer: true, items: { include: { product: true } } },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  const parsed = orderInputSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid order", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const productIds = [...new Set(input.items.map((item) => item.productId))];
  const products = await getPrisma().product.findMany({
    where: { id: { in: productIds }, isActive: true, stockStatus: "IN_STOCK" }
  });

  if (products.length !== productIds.length) {
    return NextResponse.json(
      { error: "One or more products are unavailable" },
      { status: 409 }
    );
  }

  const productMap = new Map(products.map((product) => [product.id, product]));
  for (const item of input.items) {
    const product = productMap.get(item.productId)!;
    if (!product.sizes.includes(item.size) || !product.colors.includes(item.color)) {
      return NextResponse.json(
        { error: `Invalid size or color for ${product.nameEn}` },
        { status: 400 }
      );
    }
  }

  const subtotal = input.items.reduce((total, item) => {
    const product = productMap.get(item.productId)!;
    return total + product.price * item.quantity;
  }, 0);
  const isDeposit = input.paymentMethod === "DEPOSIT_50_BANK_ZALO";

  const order = await getPrisma().order.create({
    data: {
      orderNumber: orderNumber(),
      shippingRegion: input.shippingRegion,
      paymentMethod: input.paymentMethod,
      status: isDeposit ? "PENDING_DEPOSIT" : "PENDING_ONLINE_PAYMENT",
      subtotal,
      depositAmount: isDeposit ? Math.ceil(subtotal / 2) : null,
      note: input.note || null,
      customer: {
        create: {
          fullName: input.fullName,
          phone: input.phone,
          address: input.address,
          province: input.province,
          district: input.district,
          ward: input.ward
        }
      },
      items: {
        create: input.items.map((item) => {
          const product = productMap.get(item.productId)!;
          return {
            productId: item.productId,
            productName: product.nameVi,
            unitPrice: product.price,
            quantity: item.quantity,
            size: item.size,
            color: item.color
          };
        })
      }
    },
    include: { customer: true, items: true }
  });

  return NextResponse.json(order, { status: 201 });
}
