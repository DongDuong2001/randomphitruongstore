import { z } from "zod";

const phoneSchema = z
  .string()
  .trim()
  .min(9, "Phone number is too short")
  .max(20, "Phone number is too long");

const productVariantInputSchema = z.object({
  size: z.string().trim().min(1),
  colorVi: z.string().trim().min(1),
  colorEn: z.string().trim().optional(),
  priceAdjustment: z.coerce.number().int().default(0),
  isAvailable: z.boolean().default(true)
});

const optionalMeasurementSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().positive().optional()
);

const productSizeChartInputSchema = z.object({
  size: z.string().trim().min(1),
  shoulder: optionalMeasurementSchema,
  chest: optionalMeasurementSchema,
  length: optionalMeasurementSchema,
  sleeve: optionalMeasurementSchema,
  unit: z.string().trim().min(1).default("cm")
});

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
  categoryId: z.string().trim().uuid().optional().or(z.literal("")),
  price: z.coerce.number().int().positive(),
  basePrice: z.coerce.number().int().positive().optional(),
  orderLeadTimeMinDays: z.coerce.number().int().positive().default(7),
  orderLeadTimeMaxDays: z.coerce.number().int().positive().default(10),
  images: z
    .array(
      z
        .string()
        .trim()
        .refine(
          (value) => value.startsWith("/") || z.string().url().safeParse(value).success,
          "Image must be an absolute URL or a local path"
        )
    )
    .min(1),
  sizes: z.array(z.string().trim().min(1)).min(1),
  colors: z.array(z.string().trim().min(1)).min(1),
  variants: z.array(productVariantInputSchema).optional(),
  sizeCharts: z.array(productSizeChartInputSchema).optional(),
  materialVi: z.string().trim().min(2),
  materialEn: z.string().trim().min(2),
  stockStatus: z.enum(["IN_STOCK", "OUT_OF_STOCK"]).default("IN_STOCK"),
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
  shippingRegion: z.enum(["VIETNAM", "KOREA", "TAIWAN", "JAPAN"]),
  paymentMethod: z.enum([
    "DEPOSIT_50_BANK_ZALO",
    "ONLINE_100_VNPAY",
    "ONLINE_100_MOMO"
  ]),
  noChangePolicyAck: z.boolean().refine((value) => value === true),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        productVariantId: z.string().uuid().optional(),
        quantity: z.coerce.number().int().min(1).max(10),
        size: z.string().min(1),
        color: z.string().min(1)
      })
    )
    .min(1)
});

export const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(2).optional(),
  phone: z.string().trim().min(9).max(20).optional(),
  address: z.string().trim().min(5).optional(),
  province: z.string().trim().min(2).optional(),
  district: z.string().trim().min(2).optional(),
  ward: z.string().trim().min(2).optional(),
  zaloPhone: z.string().trim().optional(),
  instagramHandle: z.string().trim().optional(),
  preferredLanguage: z.enum(["vi", "en"]).optional()
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
  ]),
  note: z.string().trim().max(1000).optional().or(z.literal(""))
});

export const orderRequestStatusSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "QUOTED", "CLOSED"])
});

export type ProductInput = z.infer<typeof productInputSchema>;
export type OrderInput = z.infer<typeof orderInputSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type OrderRequestInput = z.infer<typeof orderRequestInputSchema>;

// ─── Customer auth schemas ────────────────────────────────────────────────────

export const registerInputSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().trim().min(2, "Full name is required").optional()
});

export const loginInputSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});

export type RegisterInput = z.infer<typeof registerInputSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
