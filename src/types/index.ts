// ─── Enums (mirrored from Prisma schema) ─────────────────────────────────────
// Defined explicitly here so client code never imports from @prisma/client.

export type ProductCategory = "SUKAJAN" | "BOMBER" | "HOODIE" | "JACKET" | "SEASONAL";
export type StockStatus = "IN_STOCK" | "OUT_OF_STOCK";
export type ShippingRegion = "VIETNAM" | "KOREA" | "TAIWAN" | "JAPAN";
export type PaymentMethod = "DEPOSIT_50_BANK_ZALO" | "ONLINE_100_VNPAY" | "ONLINE_100_MOMO";
export type OrderStatus =
  | "PENDING_DEPOSIT"
  | "DEPOSIT_CONFIRMED"
  | "PENDING_ONLINE_PAYMENT"
  | "PAID_FULL"
  | "ORDERED_FROM_SUPPLIER"
  | "ARRIVED_AT_SHOP"
  | "SHIPPING"
  | "COMPLETED"
  | "CANCELLED";
export type OrderRequestStatus = "NEW" | "CONTACTED" | "QUOTED" | "CLOSED";

// ─── DTOs ─────────────────────────────────────────────────────────────────────
// These types describe exactly what the API returns to the client.
// They are NOT Prisma models — if the DB schema changes, only these need updating.

export type ProductImageDTO = {
  id: string;
  url: string;
  altVi: string;
  altEn: string;
  sortOrder: number;
};

export type ProductVariantDTO = {
  id: string;
  size: string;
  colorVi: string;
  colorEn: string;
  priceAdjustment: number;
  isAvailable: boolean;
};

export type SizeChartDTO = {
  id: string;
  size: string;
  shoulder?: number | string | null;
  chest?: number | string | null;
  length?: number | string | null;
  sleeve?: number | string | null;
  unit: string;
};

export type ProductCategoryRecordDTO = {
  id: string;
  nameVi: string;
  nameEn: string;
  slug: string;
};

export type ProductDTO = {
  id: string;
  nameVi: string;
  nameEn: string;
  slug: string;
  descriptionVi: string;
  descriptionEn: string;
  category: ProductCategory;
  categoryId?: string | null;
  categoryRecord?: ProductCategoryRecordDTO | null;
  price: number;
  basePrice?: number | null;
  orderLeadTimeMinDays?: number;
  orderLeadTimeMaxDays?: number;
  sizes: string[];
  colors: string[];
  materialVi: string;
  materialEn: string;
  stockStatus: StockStatus;
  isFeatured: boolean;
  isActive: boolean;
  // Date when passed directly from a Server Component (Prisma result);
  // string when received from the API (JSON-serialised).
  createdAt: Date | string;
  updatedAt: Date | string;
  images: ProductImageDTO[];
  variants?: ProductVariantDTO[];
  sizeCharts?: SizeChartDTO[];
};

export type CustomerDTO = {
  id: string;
  fullName: string;
  phone: string;
  address: string;
  province: string;
  district: string;
  ward: string;
};

export type OrderItemDTO = {
  id: string;
  productId: string | null;
  productVariantId?: string | null;
  productName: string;
  unitPrice: number;
  quantity: number;
  size: string;
  color: string;
};

export type OrderDTO = {
  id: string;
  orderNumber: string;
  shippingRegion: ShippingRegion;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  subtotal: number;
  depositAmount: number | null;
  note: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  customer: CustomerDTO;
  items: OrderItemDTO[];
};

export type OrderRequestDTO = {
  id: string;
  fullName: string;
  phone: string;
  socialContact: string;
  inspirationUrl: string;
  desiredSize: string;
  desiredColor: string;
  note: string | null;
  status: OrderRequestStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
};

// ─── Aliases for backward compatibility ──────────────────────────────────────
// Existing components import these names — keep them working without changes.

export type ProductWithImages = ProductDTO;
export type OrderWithDetails = OrderDTO;
