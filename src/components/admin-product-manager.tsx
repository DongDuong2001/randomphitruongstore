"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Pencil,
  Plus,
  Search,
  Trash2,
  X
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { ProductWithImages } from "@/types";
import { AdminTable } from "./admin-table";

type CategoryOption = {
  id: string;
  nameVi: string;
  nameEn: string;
  slug: string;
};

type ParsedVariant = {
  size: string;
  colorVi: string;
  colorEn: string;
  priceAdjustment: number;
  isAvailable: boolean;
};

type ParsedSizeChart = {
  size: string;
  shoulder?: number;
  chest?: number;
  length?: number;
  sleeve?: number;
  unit: string;
};

const formSchema = z.object({
  nameVi: z.string().trim().min(2),
  nameEn: z.string().trim().min(2),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  descriptionVi: z.string().trim().min(10),
  descriptionEn: z.string().trim().min(10),
  categoryId: z.string().uuid(),
  basePrice: z.number().int().positive(),
  orderLeadTimeMinDays: z.number().int().positive(),
  orderLeadTimeMaxDays: z.number().int().positive(),
  images: z.string().trim().min(5),
  variants: z.string().trim(),
  sizeCharts: z.string().trim().optional(),
  materialVi: z.string().trim().min(2),
  materialEn: z.string().trim().min(2),
  stockStatus: z.enum(["IN_STOCK", "OUT_OF_STOCK"]),
  isFeatured: z.boolean(),
  isActive: z.boolean()
});

type FormValues = z.infer<typeof formSchema>;

const defaults: FormValues = {
  nameVi: "",
  nameEn: "",
  slug: "",
  descriptionVi: "",
  descriptionEn: "",
  categoryId: "",
  basePrice: 1500000,
  orderLeadTimeMinDays: 7,
  orderLeadTimeMaxDays: 10,
  images: "",
  variants: "M | Black | Black | 0 | true\nL | Black | Black | 0 | true\nXL | Black | Black | 0 | true",
  sizeCharts: "",
  materialVi: "",
  materialEn: "",
  stockStatus: "IN_STOCK",
  isFeatured: false,
  isActive: true
};

const pageSize = 10;

function parseBoolean(value: string) {
  return !["0", "false", "no", "out", "unavailable"].includes(
    value.trim().toLowerCase()
  );
}

function parseVariantRows(value: string): ParsedVariant[] {
  const variants = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const delimiter = line.includes("|") ? "|" : ",";
      const [size = "", colorVi = "", colorEn = "", priceAdjustment = "0", isAvailable = "true"] =
        line.split(delimiter).map((part) => part.trim());
      const parsedAdjustment = Number.parseInt(priceAdjustment, 10);

      return {
        size,
        colorVi,
        colorEn: colorEn || colorVi,
        priceAdjustment: Number.isFinite(parsedAdjustment) ? parsedAdjustment : 0,
        isAvailable: parseBoolean(isAvailable)
      };
    })
    .filter((variant) => variant.size && variant.colorVi);

  const seen = new Set<string>();
  return variants.filter((variant) => {
    const key = `${variant.size.toLowerCase()}::${variant.colorVi.toLowerCase()}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function parseMeasurement(value: string) {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function parseSizeChartRows(value: string | undefined): ParsedSizeChart[] {
  const sizeCharts = (value ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const delimiter = line.includes("|") ? "|" : ",";
      const [size = "", shoulder = "", chest = "", length = "", sleeve = "", unit = "cm"] =
        line.split(delimiter).map((part) => part.trim());

      return {
        size,
        shoulder: parseMeasurement(shoulder),
        chest: parseMeasurement(chest),
        length: parseMeasurement(length),
        sleeve: parseMeasurement(sleeve),
        unit: unit || "cm"
      };
    })
    .filter((sizeChart) => sizeChart.size);

  const seen = new Set<string>();
  return sizeCharts.filter((sizeChart) => {
    const key = sizeChart.size.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function formatVariantRows(product: ProductWithImages) {
  return product.variants
    .map(
      (variant) =>
        `${variant.size} | ${variant.colorVi} | ${variant.colorEn} | ${variant.priceAdjustment} | ${
          variant.isAvailable ? "true" : "false"
        }`
    )
    .join("\n");
}

function formatMeasurement(value: number | string | null | undefined) {
  return value === null || value === undefined ? "" : String(value);
}

function formatSizeChartRows(product: ProductWithImages) {
  return (product.sizeCharts ?? [])
    .map(
      (sizeChart) =>
        `${sizeChart.size} | ${formatMeasurement(sizeChart.shoulder)} | ${formatMeasurement(
          sizeChart.chest
        )} | ${formatMeasurement(sizeChart.length)} | ${formatMeasurement(
          sizeChart.sleeve
        )} | ${sizeChart.unit}`
    )
    .join("\n");
}

export function AdminProductManager({
  categories: categoryOptions,
  products
}: {
  categories: CategoryOption[];
  products: ProductWithImages[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [serverError, setServerError] = useState("");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [visibilityFilter, setVisibilityFilter] = useState("ALL");
  const [stockFilter, setStockFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaults
  });
  const [isUploading, setIsUploading] = useState(false);
  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesQuery =
        !normalizedQuery ||
        product.nameVi.toLowerCase().includes(normalizedQuery) ||
        product.nameEn.toLowerCase().includes(normalizedQuery) ||
        product.slug.toLowerCase().includes(normalizedQuery);
      const matchesCategory =
        categoryFilter === "ALL" || product.categoryId === categoryFilter;
      const matchesVisibility =
        visibilityFilter === "ALL" ||
        (visibilityFilter === "ACTIVE" && product.isActive) ||
        (visibilityFilter === "INACTIVE" && !product.isActive) ||
        (visibilityFilter === "FEATURED" && product.isFeatured);
      const matchesStock =
        stockFilter === "ALL" || product.stockStatus === stockFilter;
      return matchesQuery && matchesCategory && matchesVisibility && matchesStock;
    });
  }, [categoryFilter, products, query, stockFilter, visibilityFilter]);
  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  function updateQuery(value: string) {
    setQuery(value);
    setPage(1);
  }

  function updateCategory(value: string) {
    setCategoryFilter(value);
    setPage(1);
  }

  function updateVisibility(value: string) {
    setVisibilityFilter(value);
    setPage(1);
  }

  function updateStock(value: string) {
    setStockFilter(value);
    setPage(1);
  }

  function createProduct() {
    setEditingId(null);
    setServerError("");
    reset({ ...defaults, categoryId: categoryOptions[0]?.id ?? "" });
    setOpen(true);
  }

  function editProduct(product: ProductWithImages) {
    setEditingId(product.id);
    setServerError("");
    reset({
      nameVi: product.nameVi,
      nameEn: product.nameEn,
      slug: product.slug,
      descriptionVi: product.descriptionVi,
      descriptionEn: product.descriptionEn,
      categoryId: product.categoryId,
      basePrice: product.basePrice,
      orderLeadTimeMinDays: product.orderLeadTimeMinDays ?? 7,
      orderLeadTimeMaxDays: product.orderLeadTimeMaxDays ?? 10,
      images: product.images.map((image) => image.url).join("\n"),
      variants: formatVariantRows(product),
      sizeCharts: formatSizeChartRows(product),
      materialVi: product.materialVi,
      materialEn: product.materialEn,
      stockStatus: product.stockStatus,
      isFeatured: product.isFeatured,
      isActive: product.isActive
    });
    setOpen(true);
  }

  async function save(values: FormValues) {
    setServerError("");
    const variants = parseVariantRows(values.variants);
    const sizeCharts = parseSizeChartRows(values.sizeCharts);
    const endpoint = editingId ? `/api/products/${editingId}` : "/api/products";
    const response = await fetch(endpoint, {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        categoryId: values.categoryId,
        images: values.images
          .split(/\r?\n/)
          .map((value) => value.trim())
          .filter(Boolean),
        variants,
        sizeCharts
      })
    });
    const result = await response.json();
    if (!response.ok) {
      setServerError(result.error ?? "Unable to save product");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  async function uploadProductImages(files: FileList | null) {
    if (!files?.length) {
      return;
    }

    setServerError("");
    setIsUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("purpose", "ADMIN_PRODUCT_IMAGE");
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData
        });
        const result = (await response.json()) as { url?: string; error?: string };
        if (!response.ok || !result.url) {
          throw new Error(result.error ?? "Unable to upload image");
        }
        uploadedUrls.push(result.url);
      }

      const currentUrls = getValues("images")
        .split(/\r?\n/)
        .map((value) => value.trim())
        .filter(Boolean);
      setValue("images", [...currentUrls, ...uploadedUrls].join("\n"), {
        shouldDirty: true,
        shouldValidate: true
      });
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "Unable to upload image"
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function remove(product: ProductWithImages) {
    if (!window.confirm(`Delete or archive "${product.nameEn}"?`)) {
      return;
    }
    const response = await fetch(`/api/products/${product.id}`, {
      method: "DELETE"
    });
    if (response.ok) {
      router.refresh();
    }
  }

  return (
    <>
      <div className="mb-5 grid gap-3 xl:grid-cols-[minmax(260px,1fr)_190px_170px_170px_auto]">
        <label className="relative min-w-0">
          <span className="sr-only">Search products</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            size={17}
          />
          <input
            className="min-h-11 w-full border border-zinc-300 bg-white py-2 pl-10 pr-3 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-[#a72b1f] focus:ring-2 focus:ring-[#a72b1f]/15"
            onChange={(event) => updateQuery(event.target.value)}
            placeholder="Search name or slug..."
            type="search"
            value={query}
          />
        </label>
        <select
          aria-label="Filter by category"
          className="min-h-11 border border-zinc-300 bg-white px-3 text-sm font-bold text-zinc-900 outline-none focus:border-[#a72b1f]"
          onChange={(event) => updateCategory(event.target.value)}
          value={categoryFilter}
        >
          <option value="ALL">All categories</option>
          {categoryOptions.map((category) => (
            <option key={category.id} value={category.id}>
              {category.nameEn}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by visibility"
          className="min-h-11 border border-zinc-300 bg-white px-3 text-sm font-bold text-zinc-900 outline-none focus:border-[#a72b1f]"
          onChange={(event) => updateVisibility(event.target.value)}
          value={visibilityFilter}
        >
          <option value="ALL">All status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="FEATURED">Featured</option>
        </select>
        <select
          aria-label="Filter by stock"
          className="min-h-11 border border-zinc-300 bg-white px-3 text-sm font-bold text-zinc-900 outline-none focus:border-[#a72b1f]"
          onChange={(event) => updateStock(event.target.value)}
          value={stockFilter}
        >
          <option value="ALL">All stock</option>
          <option value="IN_STOCK">In stock</option>
          <option value="OUT_OF_STOCK">Out of stock</option>
        </select>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#171715] px-5 text-xs font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#a72b1f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a72b1f]"
          onClick={createProduct}
          type="button"
        >
          <Plus size={16} />
          New product
        </button>
      </div>
      <AdminTable
        headers={[
          "Product",
          "Category",
          "Price",
          "Stock",
          "Featured",
          "Active",
          "Actions"
        ]}
      >
        {paginatedProducts.map((product) => (
          <tr key={product.id}>
            <td className="px-4 py-4">
              <p className="font-bold">{product.nameEn}</p>
              <p className="mt-1 text-xs text-zinc-500">{product.slug}</p>
            </td>
            <td className="px-4 py-4">
              <CategoryBadge category={product.categoryRecord?.nameEn ?? "Uncategorized"} />
            </td>
            <td className="px-4 py-4">
              {new Intl.NumberFormat("vi-VN").format(product.basePrice)}{" "}
              VND
              {product.variants.length ? (
                <p className="mt-1 text-xs text-zinc-500">
                  {product.variants.length} variants
                </p>
              ) : null}
            </td>
            <td className="px-4 py-4">
              <StockBadge status={product.stockStatus} />
            </td>
            <td className="px-4 py-4">
              <BooleanBadge enabled={product.isFeatured} label="Featured" />
            </td>
            <td className="px-4 py-4">
              <BooleanBadge
                enabled={product.isActive}
                label={product.isActive ? "Active" : "Inactive"}
              />
            </td>
            <td className="px-4 py-4">
              <div className="flex gap-2">
                <button
                  aria-label="Edit product"
                  className="grid size-10 place-items-center border border-zinc-300 bg-white text-zinc-800 transition-colors hover:border-zinc-900 hover:bg-zinc-900 hover:text-white"
                  onClick={() => editProduct(product)}
                  type="button"
                >
                  <Pencil size={15} />
                </button>
                <button
                  aria-label="Delete product"
                  className="grid size-10 place-items-center border border-red-200 bg-white text-red-700 transition-colors hover:border-red-700 hover:bg-red-700 hover:text-white"
                  onClick={() => remove(product)}
                  type="button"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </AdminTable>
      {filteredProducts.length === 0 ? (
        <div className="border-x border-b border-zinc-200 bg-white px-5 py-12 text-center text-sm text-zinc-500">
          No products match the selected filters.
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3 border border-zinc-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium text-zinc-500">
            Showing {(currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, filteredProducts.length)} of{" "}
            {filteredProducts.length} products
          </p>
          <div className="flex items-center gap-2">
            <button
              aria-label="Previous page"
              className="grid size-9 place-items-center border border-zinc-300 bg-white text-zinc-800 transition-colors hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-300"
              disabled={currentPage === 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              type="button"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="min-w-24 text-center text-xs font-bold text-zinc-700">
              Page {currentPage} / {pageCount}
            </span>
            <button
              aria-label="Next page"
              className="grid size-9 place-items-center border border-zinc-300 bg-white text-zinc-800 transition-colors hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-300"
              disabled={currentPage === pageCount}
              onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
              type="button"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {open ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4">
          <div className="mx-auto my-6 max-w-4xl border border-zinc-200 bg-white p-5 text-zinc-950 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black">
                {editingId ? "Edit product" : "New product"}
              </h2>
              <button
                aria-label="Close"
                className="grid size-10 place-items-center bg-zinc-100 text-zinc-800 transition-colors hover:bg-zinc-900 hover:text-white"
                onClick={() => setOpen(false)}
                type="button"
              >
                <X />
              </button>
            </div>
            <form
              className="mt-6 grid gap-5 sm:grid-cols-2"
              onSubmit={handleSubmit(save)}
            >
              <AdminField label="Name (VI)" error={errors.nameVi?.message}>
                <input className="field" {...register("nameVi")} />
              </AdminField>
              <AdminField label="Name (EN)" error={errors.nameEn?.message}>
                <input className="field" {...register("nameEn")} />
              </AdminField>
              <AdminField label="Slug" error={errors.slug?.message}>
                <input className="field" {...register("slug")} />
              </AdminField>
              <AdminField
                label="Catalog category"
                error={errors.categoryId?.message}
              >
                <select className="field" {...register("categoryId")}>
                  {categoryOptions.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.nameEn} / {category.nameVi}
                    </option>
                  ))}
                </select>
              </AdminField>
              <AdminField
                label="Base price (VND)"
                error={errors.basePrice?.message}
              >
                <input
                  className="field"
                  type="number"
                  {...register("basePrice", { valueAsNumber: true })}
                />
              </AdminField>
              <AdminField
                label="Lead time min days"
                error={errors.orderLeadTimeMinDays?.message}
              >
                <input
                  className="field"
                  type="number"
                  {...register("orderLeadTimeMinDays", { valueAsNumber: true })}
                />
              </AdminField>
              <AdminField
                label="Lead time max days"
                error={errors.orderLeadTimeMaxDays?.message}
              >
                <input
                  className="field"
                  type="number"
                  {...register("orderLeadTimeMaxDays", { valueAsNumber: true })}
                />
              </AdminField>
              <div className="sm:col-span-2">
                <AdminField label="Variants" error={errors.variants?.message}>
                  <textarea
                    className="field min-h-28"
                    placeholder="M | Black | Black | 0 | true"
                    {...register("variants")}
                  />
                </AdminField>
              </div>
              <div className="sm:col-span-2">
                <AdminField
                  label="Size chart"
                  error={errors.sizeCharts?.message}
                >
                  <textarea
                    className="field min-h-24"
                    placeholder="M | 44 | 54 | 65 | 60 | cm"
                    {...register("sizeCharts")}
                  />
                </AdminField>
              </div>
              <AdminField label="Material (VI)" error={errors.materialVi?.message}>
                <input className="field" {...register("materialVi")} />
              </AdminField>
              <AdminField label="Material (EN)" error={errors.materialEn?.message}>
                <input className="field" {...register("materialEn")} />
              </AdminField>
              <AdminField label="Stock status" error={errors.stockStatus?.message}>
                <select className="field" {...register("stockStatus")}>
                  <option value="IN_STOCK">In stock</option>
                  <option value="OUT_OF_STOCK">Out of stock</option>
                </select>
              </AdminField>
              <div className="sm:col-span-2">
                <AdminField
                  label="Image URLs (one per line)"
                  error={errors.images?.message}
                >
                  <label className="mb-3 flex min-h-32 cursor-pointer flex-col items-center justify-center border border-dashed border-zinc-300 bg-zinc-50 p-5 text-center transition-colors hover:border-[#a72b1f] hover:bg-red-50/40">
                    <ImagePlus className="text-[#a72b1f]" size={28} />
                    <span className="mt-3 text-sm font-bold">
                      {isUploading ? "Uploading images..." : "Upload product images"}
                    </span>
                    <span className="mt-1 text-xs text-zinc-500">
                      JPG, PNG or WebP. Max 5 MB per image.
                    </span>
                    <input
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      disabled={isUploading}
                      multiple
                      onChange={(event) => {
                        void uploadProductImages(event.target.files);
                        event.target.value = "";
                      }}
                      type="file"
                    />
                  </label>
                  <textarea className="field min-h-24" {...register("images")} />
                </AdminField>
              </div>
              <div className="sm:col-span-2">
                <AdminField
                  label="Description (VI)"
                  error={errors.descriptionVi?.message}
                >
                  <textarea
                    className="field min-h-24"
                    {...register("descriptionVi")}
                  />
                </AdminField>
              </div>
              <div className="sm:col-span-2">
                <AdminField
                  label="Description (EN)"
                  error={errors.descriptionEn?.message}
                >
                  <textarea
                    className="field min-h-24"
                    {...register("descriptionEn")}
                  />
                </AdminField>
              </div>
              <label className="flex items-center gap-2 text-sm font-bold">
                <input type="checkbox" {...register("isFeatured")} />
                Featured
              </label>
              <label className="flex items-center gap-2 text-sm font-bold">
                <input type="checkbox" {...register("isActive")} />
                Active
              </label>
              {serverError ? (
                <p className="error-text sm:col-span-2">{serverError}</p>
              ) : null}
              <button
                className="inline-flex min-h-12 items-center justify-center bg-[#171715] px-6 text-xs font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#a72b1f] disabled:cursor-wait disabled:bg-zinc-300 disabled:text-zinc-600 sm:col-span-2 sm:justify-self-start"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? "Saving..." : "Save product"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const styles: Record<string, string> = {
    SUKAJAN: "border-red-200 bg-red-50 text-red-800",
    BOMBER: "border-blue-200 bg-blue-50 text-blue-800",
    HOODIE: "border-violet-200 bg-violet-50 text-violet-800",
    JACKET: "border-amber-200 bg-amber-50 text-amber-800",
    SEASONAL: "border-emerald-200 bg-emerald-50 text-emerald-800"
  };

  return (
    <span
      className={`inline-flex border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${
        styles[category] ?? "border-zinc-200 bg-zinc-50 text-zinc-700"
      }`}
    >
      {category}
    </span>
  );
}

function BooleanBadge({
  enabled,
  label
}: {
  enabled: boolean;
  label: string;
}) {
  return (
    <span
      className={`inline-flex border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${
        enabled
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-zinc-200 bg-zinc-100 text-zinc-500"
      }`}
    >
      {enabled ? label : label === "Inactive" ? label : "No"}
    </span>
  );
}

function StockBadge({ status }: { status: string }) {
  const inStock = status === "IN_STOCK";
  return (
    <span
      className={`inline-flex border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${
        inStock
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}
    >
      {inStock ? "In stock" : "Out of stock"}
    </span>
  );
}

function AdminField({
  label,
  error,
  children
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {error ? <span className="error-text">{error}</span> : null}
    </label>
  );
}
