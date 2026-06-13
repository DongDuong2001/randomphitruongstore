import { z } from "zod";

const phoneSchema = z
  .string()
  .trim()
  .min(9, "Phone number is too short")
  .max(20, "Phone number is too long");

export const productInputSchema = z.object({
  nameVi: z.string().trim().min(2),
  nameEn: z.string().trim().min(2),
  slug: z
    .string()
    .trim()
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  descriptionVi: z.string().trim().min(10),
  descriptionEn: z.string().trim().min(10),
  category: z.enum(["SUKAJAN", "BOMBER", "HOODIE", "JACKET", "SEASONAL"]),
  price: z.coerce.number().int().positive(),
  images: z.array(z.string().url()).min(1),
  sizes: z.array(z.string().trim().min(1)).min(1),
  colors: z.array(z.string().trim().min(1)).min(1),
  materialVi: z.string().trim().min(2),
  materialEn: z.string().trim().min(2),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true)
});

export const orderInputSchema = z.object({
  fullName: z.string().trim().min(2),
  phone: phoneSchema,
  address: z.string().trim().min(5),
  province: z.string().trim().min(2),
  district: z.string().trim().min(2),
  ward: z.string().trim().min(2),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
  shippingRegion: z.literal("VIETNAM"),
  paymentMethod: z.enum([
    "DEPOSIT_50_BANK_ZALO",
    "ONLINE_100_VNPAY",
    "ONLINE_100_MOMO"
  ]),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.coerce.number().int().min(1).max(10),
        size: z.string().min(1),
        color: z.string().min(1)
      })
    )
    .min(1)
});

export const orderRequestInputSchema = z.object({
  fullName: z.string().trim().min(2),
  phone: phoneSchema,
  socialContact: z.string().trim().min(2),
  inspirationUrl: z.string().min(1),
  desiredSize: z.string().trim().min(1),
  desiredColor: z.string().trim().min(1),
  note: z.string().trim().max(1000).optional().or(z.literal(""))
});

export const orderStatusSchema = z.object({
  status: z.enum([
    "PENDING_DEPOSIT",
    "DEPOSIT_CONFIRMED",
    "PENDING_ONLINE_PAYMENT",
    "PAID_FULL",
    "ORDERED_FROM_SUPPLIER",
    "ARRIVED_AT_SHOP",
    "SHIPPING",
    "COMPLETED",
    "CANCELLED"
  ])
});

export const orderRequestStatusSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "QUOTED", "CLOSED"])
});

export type ProductInput = z.infer<typeof productInputSchema>;
export type OrderInput = z.infer<typeof orderInputSchema>;
export type OrderRequestInput = z.infer<typeof orderRequestInputSchema>;
