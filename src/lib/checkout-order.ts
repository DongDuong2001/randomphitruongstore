import { buildShippingAddressSnapshot, normalizeEmail } from "@/lib/customer-account";
import type { OrderInput } from "@/lib/validations";
import type { PrismaClient } from "@prisma/client";

type CheckoutOrderStore = PrismaClient;

type CheckoutOrderTransaction = Parameters<PrismaClient["$transaction"]>[0] extends (tx: infer T) => Promise<unknown> ? T : never;

type CustomerCheckoutData = {
  fullName: string;
  phone: string;
};

export class CheckoutOrderError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "CheckoutOrderError";
  }
}

export async function createCheckoutOrder({
  prisma,
  input,
  userEmail,
  generateOrderNumber,
  now = () => new Date()
}: {
  prisma: CheckoutOrderStore;
  input: OrderInput;
  userEmail: string | null | undefined;
  generateOrderNumber: () => string;
  now?: () => Date;
}) {
  const productIds = [...new Set(input.items.map((item) => item.productId))];
  const variantIds = [
    ...new Set(
      input.items.map((item) => item.productVariantId).filter((id): id is string => Boolean(id))
    )
  ];

  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true, stockStatus: "IN_STOCK" }
  });

  if (products.length !== productIds.length) {
    throw new CheckoutOrderError("One or more products are unavailable", 409);
  }

  const itemsWithoutVariantId = input.items.filter((item) => !item.productVariantId);
  const productsNeedingVariants = [...new Set(itemsWithoutVariantId.map((i) => i.productId))];

  const variants = await prisma.productVariant.findMany({
    where: {
      OR: [{ id: { in: variantIds } }, { productId: { in: productsNeedingVariants } }],
      isAvailable: true
    }
  });

  const productMap = new Map(products.map((product) => [product.id, product]));
  const variantMap = new Map(variants.map((variant) => [variant.id, variant]));
  const orderItems = input.items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new CheckoutOrderError("One or more products are unavailable", 409);
    }

    // Handle legacy cart items without productVariantId
    let variant;
    if (item.productVariantId) {
      variant = variantMap.get(item.productVariantId);
      if (!variant || variant.productId !== item.productId) {
        throw new CheckoutOrderError("Invalid product variant", 400);
      }
    } else {
      // Fallback: find variant by size/color
      const fallback = variants.find(
        (v) => v.productId === item.productId && v.size === item.size && v.colorVi === item.color
      );
      if (!fallback) {
        throw new CheckoutOrderError("Product variant not found for legacy item", 400);
      }
      variant = fallback;
    }

    const selectedSize = variant.size;
    const selectedColor = variant.colorVi;
    const unitPrice = product.basePrice + variant.priceAdjustment;

    return {
      productId: item.productId,
      productVariantId: variant.id,
      productName: product.nameVi,
      itemNameSnapshot: product.nameVi,
      unitPrice,
      lineTotal: unitPrice * item.quantity,
      quantity: item.quantity,
      size: selectedSize,
      selectedSize,
      color: selectedColor,
      selectedColor
    };
  });

  const subtotalAmount = orderItems.reduce((total, item) => total + item.lineTotal, 0);
  const isDeposit = input.paymentMethod === "DEPOSIT_50_BANK_ZALO";
  const depositPaymentAmount = isDeposit ? Math.ceil(subtotalAmount / 2) : null;
  const shippingFee = 0;
  const totalAmount = subtotalAmount + shippingFee;
  const remainingAmount =
    depositPaymentAmount === null ? 0 : totalAmount - depositPaymentAmount;
  const paymentOption = isDeposit ? "DEPOSIT_50" : "ONLINE_100";
  const paymentAmount = depositPaymentAmount ?? totalAmount;
  const normalizedEmail = normalizeEmail(userEmail);
  const customerData = customerDataFromCheckout(input);

  return prisma.$transaction(async (transaction) => {
    const customer = normalizedEmail
      ? await findOrCreateSignedInCustomer(transaction, normalizedEmail, customerData)
      : await transaction.customer.create({
          data: customerData,
          select: { id: true }
        });

    return transaction.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        shippingRegion: input.shippingRegion,
        paymentMethod: input.paymentMethod,
        paymentOption,
        status: isDeposit ? "PENDING_DEPOSIT" : "PENDING_ONLINE_PAYMENT",
        subtotalAmount,
        remainingAmount,
        shippingFee,
        totalAmount,
        note: input.note || null,
        customerId: customer.id,
        sizeColorLocked: true,
        noChangePolicyAck: true,
        noChangePolicyAckAt: now(),
        shippingAddress: {
          create: buildShippingAddressSnapshot(input)
        },
        items: {
          create: orderItems
        },
        payments: {
          create: {
            paymentType: isDeposit ? "DEPOSIT" : "FULL_PAYMENT",
            paymentMethod: input.paymentMethod,
            paymentStatus: "PENDING",
            amount: paymentAmount
          }
        }
      },
      include: {
        customer: true,
        items: true,
        shippingAddress: true,
        payments: true
      }
    });
  });
}

function customerDataFromCheckout(input: OrderInput): CustomerCheckoutData {
  return {
    fullName: input.fullName,
    phone: input.phone
  };
}

async function findOrCreateSignedInCustomer(
  transaction: CheckoutOrderTransaction,
  email: string,
  customerData: CustomerCheckoutData
) {
  const customer = await transaction.customer.findFirst({
    where: { email },
    orderBy: { updatedAt: "desc" },
    select: { id: true }
  });

  if (customer) {
    return transaction.customer.update({
      where: { id: customer.id },
      data: customerData,
      select: { id: true }
    });
  }

  return transaction.customer.create({
    data: {
      email,
      ...customerData
    },
    select: { id: true }
  });
}
