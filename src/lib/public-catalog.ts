import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { getPrisma } from "@/lib/prisma";

export const publicCatalogCacheTag = "public-catalog";

const catalogRevalidateSeconds = 60;

export const getPublicShopProducts = unstable_cache(
  async () =>
    getPrisma().product.findMany({
      where: { isActive: true, stockStatus: "IN_STOCK" },
      select: {
        id: true,
        nameVi: true,
        nameEn: true,
        slug: true,
        categoryId: true,
        basePrice: true,
        stockStatus: true,
        categoryRecord: {
          select: {
            id: true,
            nameVi: true,
            nameEn: true,
            slug: true
          }
        },
        images: {
          orderBy: { sortOrder: "asc" },
          take: 1,
          select: {
            id: true,
            url: true,
            altVi: true,
            altEn: true,
            sortOrder: true
          }
        },
        variants: {
          orderBy: [{ size: "asc" }, { colorVi: "asc" }],
          select: {
            id: true,
            size: true,
            colorVi: true,
            colorEn: true,
            priceAdjustment: true,
            isAvailable: true
          }
        }
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }]
    }),
  ["public-shop-products-v1"],
  {
    revalidate: catalogRevalidateSeconds,
    tags: [publicCatalogCacheTag]
  }
);

export const getPublicProductBySlug = (slug: string) =>
  unstable_cache(
    async () =>
      getPrisma().product.findFirst({
        where: { slug, isActive: true },
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          variants: { orderBy: [{ size: "asc" }, { colorVi: "asc" }] },
          sizeCharts: { orderBy: { size: "asc" } }
        }
      }),
    ["public-product-by-slug-v1", slug],
    {
      revalidate: catalogRevalidateSeconds,
      tags: [publicCatalogCacheTag]
    }
  )();

export function revalidatePublicCatalog(productSlug?: string | null) {
  revalidateTag(publicCatalogCacheTag, "max");
  revalidatePath("/", "page");
  revalidatePath("/shop", "page");

  if (productSlug) {
    revalidatePath(`/shop/${productSlug}`, "page");
  }
}
