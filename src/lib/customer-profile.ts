import { normalizeEmail } from "@/lib/customer-account";
import type { ProfileUpdateInput } from "@/lib/validations";

export const customerProfileSelect = {
  id: true,
  fullName: true,
  phone: true,
  email: true,
  address: true,
  province: true,
  district: true,
  ward: true,
  zaloPhone: true,
  instagramHandle: true,
  preferredLanguage: true
};

type CustomerProfile = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  address: string;
  province: string;
  district: string;
  ward: string;
  zaloPhone: string | null;
  instagramHandle: string | null;
  preferredLanguage: string;
};

type CustomerProfileStore = {
  customer: {
    findFirst(args: {
      where: { email: string };
      orderBy: { updatedAt: "desc" };
      select: { id: true };
    }): Promise<{ id: string } | null>;
    update(args: {
      where: { id: string };
      data: ProfileUpdateInput;
      select: typeof customerProfileSelect;
    }): Promise<CustomerProfile>;
    create(args: {
      data: {
        email: string;
        fullName: string;
        phone: string;
        address: string;
        province: string;
        district: string;
        ward: string;
        zaloPhone?: string;
        instagramHandle?: string;
        preferredLanguage?: "vi" | "en";
      };
      select: typeof customerProfileSelect;
    }): Promise<CustomerProfile>;
  };
};

export async function saveCustomerProfileForEmail({
  prisma,
  email,
  authUserId,
  authFullName,
  input
}: {
  prisma: CustomerProfileStore;
  email: string;
  authUserId: string;
  authFullName?: unknown;
  input: ProfileUpdateInput;
}) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error("Cannot save a customer profile without an auth email");
  }

  const customer = await prisma.customer.findFirst({
    where: { email: normalizedEmail },
    orderBy: { updatedAt: "desc" },
    select: { id: true }
  });

  if (customer) {
    return prisma.customer.update({
      where: { id: customer.id },
      data: input,
      select: customerProfileSelect
    });
  }

  return prisma.customer.create({
    data: buildCustomerCreateData({
      email: normalizedEmail,
      authUserId,
      authFullName,
      input
    }),
    select: customerProfileSelect
  });
}

function buildCustomerCreateData({
  email,
  authUserId,
  authFullName,
  input
}: {
  email: string;
  authUserId: string;
  authFullName?: unknown;
  input: ProfileUpdateInput;
}) {
  const fullName = input.fullName?.trim() || authDisplayName(email, authUserId, authFullName);
  const data = {
    email,
    fullName,
    phone: input.phone ?? "",
    address: input.address ?? "",
    province: input.province ?? "",
    district: input.district ?? "",
    ward: input.ward ?? ""
  } satisfies {
    email: string;
    fullName: string;
    phone: string;
    address: string;
    province: string;
    district: string;
    ward: string;
    zaloPhone?: string;
    instagramHandle?: string;
    preferredLanguage?: "vi" | "en";
  };

  return {
    ...data,
    ...(input.zaloPhone !== undefined ? { zaloPhone: input.zaloPhone } : {}),
    ...(input.instagramHandle !== undefined
      ? { instagramHandle: input.instagramHandle }
      : {}),
    ...(input.preferredLanguage !== undefined
      ? { preferredLanguage: input.preferredLanguage }
      : {})
  };
}

function authDisplayName(email: string, authUserId: string, authFullName?: unknown) {
  if (typeof authFullName === "string" && authFullName.trim()) {
    return authFullName.trim();
  }

  return email.split("@")[0] || authUserId;
}
