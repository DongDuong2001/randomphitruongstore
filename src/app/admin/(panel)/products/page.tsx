import { AdminProductManager } from "@/components/admin-product-manager";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    getPrisma().product.findMany({
      include: {
        categoryRecord: true,
        images: { orderBy: { sortOrder: "asc" } },
        variants: { orderBy: [{ size: "asc" }, { colorVi: "asc" }] },
        sizeCharts: { orderBy: { size: "asc" } }
      },
      orderBy: { updatedAt: "desc" }
    }),
    getPrisma().category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }]
    })
  ]);

  return (
    <>
      <header className="mb-8">
        <p className="eyebrow text-zinc-500">Catalog</p>
        <h1 className="mt-2 text-4xl font-black">Products</h1>
      </header>
      <AdminProductManager
        categories={categories}
        products={products.map((product) => ({
          ...product,
          sizeCharts: product.sizeCharts.map((sizeChart) => ({
            ...sizeChart,
            shoulder: serializeMeasurement(sizeChart.shoulder),
            chest: serializeMeasurement(sizeChart.chest),
            length: serializeMeasurement(sizeChart.length),
            sleeve: serializeMeasurement(sizeChart.sleeve)
          }))
        }))}
      />
    </>
  );
}

function serializeMeasurement(value: { toNumber: () => number } | null) {
  return value === null ? null : value.toNumber();
}
