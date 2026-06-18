import { normalizeEmail } from "@/lib/customer-account";
import type { OrderRequestInput } from "@/lib/validations";

type InquiryStatusInput = "NEW" | "CONTACTED" | "QUOTED" | "CLOSED";

export const adminProductInquiryInclude = {
  images: { orderBy: { sortOrder: "asc" } },
  product: {
    select: { nameVi: true, nameEn: true, slug: true }
  },
  customer: {
    select: { fullName: true, phone: true, email: true }
  }
} as const;

type ProductInquiryStore = {
  $transaction<T>(callback: (transaction: ProductInquiryTransaction) => Promise<T>): Promise<T>;
};

type ProductInquiryTransaction = {
  customer: {
    findFirst(args: {
      where: { email: string };
      orderBy: { updatedAt: "desc" };
      select: { id: true };
    }): Promise<{ id: string } | null>;
  };
  orderRequest: {
    create(args: {
      data: LegacyOrderRequestCreateData;
    }): Promise<{ id: string }>;
  };
  productInquiry: {
    create(args: {
      data: ProductInquiryCreateData;
      include: typeof adminProductInquiryInclude;
    }): Promise<unknown>;
  };
};

type LegacyOrderRequestCreateData = Omit<OrderRequestInput, "note"> & {
  note: string | null;
};

type ProductInquiryCreateData = {
  customerId: string | null;
  fullName: string;
  phone: string;
  email?: string;
  instagramHandle: string;
  externalProductUrl: string;
  customerMessage: string | null;
  preferredSize: string;
  preferredColor: string;
  images: {
    create: {
      imageUrl: string;
    };
  };
};

type ProductInquiryListStore = {
  productInquiry: {
    findMany(args: {
      include: typeof adminProductInquiryInclude;
      orderBy: { createdAt: "desc" };
    }): Promise<AdminProductInquiry[]>;
  };
};

type AdminProductInquiry = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  zaloPhone: string | null;
  instagramHandle: string | null;
  externalProductUrl: string | null;
  customerMessage: string | null;
  preferredSize: string | null;
  preferredColor: string | null;
  status: string;
  images: Array<{
    id: string;
    imageUrl: string;
  }>;
};

type ProductInquiryStatusStore = {
  productInquiry: {
    update(args: {
      where: { id: string };
      data: { status: InquiryStatusInput };
    }): Promise<{ status: string }>;
  };
};

export async function createProductInquiryFromOrderRequest({
  prisma,
  input,
  userEmail
}: {
  prisma: ProductInquiryStore;
  input: OrderRequestInput;
  userEmail: string | null | undefined;
}) {
  const email = normalizeEmail(userEmail);

  return prisma.$transaction(async (transaction) => {
    const customer = email
      ? await transaction.customer.findFirst({
          where: { email },
          orderBy: { updatedAt: "desc" },
          select: { id: true }
        })
      : null;

    await transaction.orderRequest.create({
      data: {
        ...input,
        note: input.note || null
      }
    });

    return transaction.productInquiry.create({
      data: {
        customerId: customer?.id ?? null,
        fullName: input.fullName,
        phone: input.phone,
        ...(email ? { email } : {}),
        instagramHandle: input.socialContact,
        externalProductUrl: input.inspirationUrl,
        customerMessage: input.note || null,
        preferredSize: input.desiredSize,
        preferredColor: input.desiredColor,
        images: {
          create: {
            imageUrl: input.inspirationUrl
          }
        }
      },
      include: adminProductInquiryInclude
    });
  });
}

export function listAdminProductInquiries(prisma: ProductInquiryListStore) {
  return prisma.productInquiry.findMany({
    include: adminProductInquiryInclude,
    orderBy: { createdAt: "desc" }
  });
}

export function updateProductInquiryStatus(
  prisma: ProductInquiryStatusStore,
  id: string,
  status: InquiryStatusInput
) {
  return prisma.productInquiry.update({
    where: { id },
    data: { status }
  });
}
