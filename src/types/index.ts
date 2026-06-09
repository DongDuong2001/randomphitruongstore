import type { Prisma } from "@prisma/client";

export type ProductWithImages = Prisma.ProductGetPayload<{
  include: { images: true };
}>;

export type OrderWithDetails = Prisma.OrderGetPayload<{
  include: {
    customer: true;
    items: { include: { product: true } };
  };
}>;
