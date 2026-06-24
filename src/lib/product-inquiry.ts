import { normalizeEmail } from "@/lib/customer-account";
import {
  safeInquiryImageUrl,
  safeInquiryLinkUrl
} from "@/lib/inquiry-url";
import type { ProductInquiryInput } from "@/lib/validations";

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
      where: { supabaseUserId: string };
      orderBy: { updatedAt: "desc" };
      select: { id: true };
    }): Promise<{ id: string } | null>;
  };
  productInquiry: {
    create(args: {
      data: ProductInquiryCreateData;
      include: typeof adminProductInquiryInclude;
    }): Promise<unknown>;
  };
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

export async function createProductInquiry({
  prisma,
  input,
  userEmail,
  supabaseUserId
}: {
  prisma: ProductInquiryStore;
  input: ProductInquiryInput;
  userEmail: string | null | undefined;
  supabaseUserId?: string | null | undefined;
}) {
  const email = normalizeEmail(userEmail);
  const authUserId = normalizeSupabaseUserId(supabaseUserId);
  const inspirationUrl = safeInquiryImageUrl(input.inspirationUrl);
  if (!inspirationUrl) {
    throw new Error("Invalid inspiration image URL");
  }

  return prisma.$transaction(async (transaction) => {
    const customer = authUserId
      ? await transaction.customer.findFirst({
          where: { supabaseUserId: authUserId },
          orderBy: { updatedAt: "desc" },
          select: { id: true }
        })
      : null;

    return transaction.productInquiry.create({
      data: {
        customerId: customer?.id ?? null,
        fullName: input.fullName,
        phone: input.phone,
        ...(email ? { email } : {}),
        instagramHandle: input.socialContact,
        externalProductUrl: inspirationUrl,
        customerMessage: input.note || null,
        preferredSize: input.desiredSize,
        preferredColor: input.desiredColor,
        images: {
          create: {
            imageUrl: inspirationUrl
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

export function adminInquiryPresentationUrls({
  images,
  externalProductUrl
}: {
  images: Array<{ imageUrl: string | null }>;
  externalProductUrl: string | null;
}) {
  const imageUrl =
    images.map((image) => safeInquiryImageUrl(image.imageUrl)).find(Boolean) ??
    safeInquiryImageUrl(externalProductUrl);
  const linkUrl = safeInquiryLinkUrl(externalProductUrl) ?? imageUrl;

  return {
    imageUrl,
    linkUrl
  };
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

function normalizeSupabaseUserId(userId: string | null | undefined) {
  const trimmed = userId?.trim();
  return trimmed || null;
}
