import type { OrderInput } from "@/lib/validations";

export function normalizeEmail(email: string | null | undefined) {
  const trimmed = email?.trim().toLowerCase();
  return trimmed || null;
}

export function buildShippingAddressSnapshot(input: Pick<
  OrderInput,
  "fullName" | "phone" | "address" | "province" | "district" | "ward" | "shippingRegion"
>) {
  return {
    recipientName: input.fullName,
    phone: input.phone,
    country: countryForShippingRegion(input.shippingRegion),
    provinceCity: input.province,
    district: input.district,
    ward: input.ward,
    streetAddress: input.address,
    fullAddress: [
      input.address,
      input.ward,
      input.district,
      input.province
    ].join(", "),
    isInternational: input.shippingRegion !== "VIETNAM"
  };
}

export function isMissingCustomerEmailColumn(error: unknown) {
  const prismaError = error as {
    code?: string;
    meta?: { modelName?: string; column?: string };
  };

  return (
    prismaError?.code === "P2022" &&
    prismaError.meta?.modelName === "Customer" &&
    prismaError.meta?.column === "Customer.email"
  );
}

function countryForShippingRegion(region: OrderInput["shippingRegion"]) {
  switch (region) {
    case "KOREA":
      return "Korea";
    case "TAIWAN":
      return "Taiwan";
    case "JAPAN":
      return "Japan";
    case "VIETNAM":
    default:
      return "Vietnam";
  }
}
