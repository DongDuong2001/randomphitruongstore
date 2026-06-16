import { err, handlePrismaError, ok, zodDetails } from "@/lib/api-response";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { orderNumber } from "@/lib/format";
import { getPrisma } from "@/lib/prisma";
import { orderInputSchema } from "@/lib/validations";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return err("Unauthorized", 401);
  }

  try {
    const orders = await getPrisma().order.findMany({
      include: { customer: true, items: { include: { product: true } } },
      orderBy: { createdAt: "desc" }
    });
    return ok(orders);
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function POST(request: Request) {
  const parsed = orderInputSchema.safeParse(await request.json());
  if (!parsed.success) {
    return err("Invalid order data", 400, zodDetails(parsed.error));
  }

  const input = parsed.data;
  try {
    const productIds = [...new Set(input.items.map((item) => item.productId))];
    const products = await getPrisma().product.findMany({
      where: { id: { in: productIds }, isActive: true, stockStatus: "IN_STOCK" }
    });

    if (products.length !== productIds.length) {
      return err("One or more products are unavailable", 409);
    }

    const productMap = new Map(products.map((product) => [product.id, product]));
    for (const item of input.items) {
      const product = productMap.get(item.productId)!;
      if (!product.sizes.includes(item.size) || !product.colors.includes(item.color)) {
        return err(`Invalid size or color for ${product.nameEn}`, 400);
      }
    }

    const subtotal = input.items.reduce((total, item) => {
      const product = productMap.get(item.productId)!;
      return total + product.price * item.quantity;
    }, 0);
    const isDeposit = input.paymentMethod === "DEPOSIT_50_BANK_ZALO";
    const depositAmount = isDeposit ? Math.ceil(subtotal / 2) : null;
    const shippingFee = 0;
    const totalAmount = subtotal + shippingFee;
    const remainingAmount = depositAmount === null ? 0 : totalAmount - depositAmount;
    const paymentOption = isDeposit ? "DEPOSIT_50" : "ONLINE_100";

    const order = await getPrisma().order.create({
      data: {
        orderNumber: orderNumber(),
        shippingRegion: input.shippingRegion,
        paymentMethod: input.paymentMethod,
        paymentOption,
        status: isDeposit ? "PENDING_DEPOSIT" : "PENDING_ONLINE_PAYMENT",
        subtotal,
        depositAmount,
        subtotalAmount: subtotal,
        remainingAmount,
        shippingFee,
        totalAmount,
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

    return ok(order, 201);
  } catch (error) {
    return handlePrismaError(error);
  }
}