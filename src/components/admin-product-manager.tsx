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
import { useForm, useWatch, useFieldArray } from "react-hook-form";
import { z } from "zod";
import {
  duplicateProductImageUrlIndex,
  isSupportedProductImageUrl,
  MAX_PRODUCT_IMAGES,
  moveProductImageUrl,
  removeProductImageUrl,
  setPrimaryProductImageUrl,
  splitProductImageUrls
} from "@/lib/product-images";
import type { ProductWithImages } from "@/types";
import { AdminTable } from "./admin-table";

type CategoryOption = {
  id: string;
  nameVi: string;
  nameEn: string;
  slug: string;
};

const optionalMeasurementSchema = z.number().positive().optional();

const formSchema = z.object({
  nameVi: z.string().trim().min(2),
  nameEn: z.string().trim().min(2),
  slug: z.string().trim().regex(/^[a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễđìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹ]+(?:-[a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễđìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹ]+)*$/),
  descriptionVi: z.string().trim().min(10),
  descriptionEn: z.string().trim().min(10),
  categoryId: z.string().uuid(),
  basePrice: z.number().int().positive(),
  orderLeadTimeMinDays: z.number().int().positive(),
  orderLeadTimeMaxDays: z.number().int().positive(),
  images: z.string().superRefine((value, context) => {
    const urls = splitProductImageUrls(value);
    if (urls.length === 0) {
      context.addIssue({
        code: "custom",
        message: "At least one product image is required"
      });
      return;
    }

    if (urls.length > MAX_PRODUCT_IMAGES) {
      context.addIssue({
        code: "custom",
        message: `Products can have at most ${MAX_PRODUCT_IMAGES} images`
      });
    }

    const invalidIndex = urls.findIndex(
      (url) => !isSupportedProductImageUrl(url)
    );
    if (invalidIndex !== -1) {
      context.addIssue({
        code: "custom",
        message: `Image ${invalidIndex + 1} must be an absolute URL or a local path`
      });
    }

    const duplicateIndex = duplicateProductImageUrlIndex(urls);
    if (duplicateIndex !== -1) {
      context.addIssue({
        code: "custom",
        message: `Image ${duplicateIndex + 1} duplicates an existing image`
      });
    }
  }),
  variants: z.array(z.object({
    size: z.string().trim().min(1, "Size is required"),
    colorVi: z.string().trim().min(1, "Color (VI) is required"),
    colorEn: z.string().trim().optional(),
    priceAdjustment: z.number().int(),
    isAvailable: z.boolean()
  })).min(1, "At least one variant is required"),
  sizeCharts: z.array(z.object({
    size: z.string().trim().min(1, "Size is required"),
    shoulder: optionalMeasurementSchema,
    chest: optionalMeasurementSchema,
    length: optionalMeasurementSchema,
    sleeve: optionalMeasurementSchema,
    unit: z.string().trim().min(1)
  })),
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
  variants: [
    { size: "M", colorVi: "Black", colorEn: "Black", priceAdjustment: 0, isAvailable: true },
    { size: "L", colorVi: "Black", colorEn: "Black", priceAdjustment: 0, isAvailable: true },
    { size: "XL", colorVi: "Black", colorEn: "Black", priceAdjustment: 0, isAvailable: true }
  ],
  sizeCharts: [],
  materialVi: "",
  materialEn: "",
  stockStatus: "IN_STOCK",
  isFeatured: false,
  isActive: true
};

const pageSize = 10;

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
    control,
    getValues,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaults
  });
  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
    control,
    name: "variants"
  });
  const { fields: sizeChartFields, append: appendSizeChart, remove: removeSizeChart } = useFieldArray({
    control,
    name: "sizeCharts"
  });
  const imageText = useWatch({ control, name: "images" });
  const imageUrls = splitProductImageUrls(imageText);
  const imageUploadLimitReached = imageUrls.length >= MAX_PRODUCT_IMAGES;
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
      variants: product.variants.map((v) => ({
        size: v.size,
        colorVi: v.colorVi,
        colorEn: v.colorEn || v.colorVi,
        priceAdjustment: v.priceAdjustment,
        isAvailable: v.isAvailable
      })),
      sizeCharts: (product.sizeCharts ?? []).map((s) => ({
        size: s.size,
        shoulder: s.shoulder !== null && s.shoulder !== undefined ? Number(s.shoulder) : undefined,
        chest: s.chest !== null && s.chest !== undefined ? Number(s.chest) : undefined,
        length: s.length !== null && s.length !== undefined ? Number(s.length) : undefined,
        sleeve: s.sleeve !== null && s.sleeve !== undefined ? Number(s.sleeve) : undefined,
        unit: s.unit || "cm"
      })),
      materialVi: product.materialVi,
      materialEn: product.materialEn,
      stockStatus: product.stockStatus,
      isFeatured: product.isFeatured,
      isActive: product.isActive
    });
    setOpen(true);
  }

  function updateImageUrls(urls: string[]) {
    setValue("images", urls.join("\n"), {
      shouldDirty: true,
      shouldValidate: true
    });
  }

  async function save(values: FormValues) {
    setServerError("");
    const endpoint = editingId ? `/api/products/${editingId}` : "/api/products";
    const response = await fetch(endpoint, {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        categoryId: values.categoryId,
        images: splitProductImageUrls(values.images)
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
    const selectedFiles = Array.from(files);
    const currentUrls = splitProductImageUrls(getValues("images"));
    const remainingSlots = MAX_PRODUCT_IMAGES - currentUrls.length;

    if (remainingSlots <= 0) {
      setServerError(`Products can have at most ${MAX_PRODUCT_IMAGES} images`);
      return;
    }

    if (selectedFiles.length > remainingSlots) {
      setServerError(
        `You can add ${remainingSlots} more image${remainingSlots === 1 ? "" : "s"}`
      );
      return;
    }

    setIsUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of selectedFiles) {
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

      updateImageUrls([...currentUrls, ...uploadedUrls]);
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
              {product.images.length > 0 ? (
                <div className="mt-3 flex max-w-[320px] gap-2 overflow-x-auto pb-1">
                  {product.images.map((image, index) => (
                    <div
                      className="relative size-12 shrink-0 overflow-hidden border border-zinc-200 bg-zinc-100"
                      key={image.id}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt={`${product.nameEn} image ${index + 1}`}
                        className="h-full w-full object-cover"
                        src={image.url}
                      />
                      {index === 0 ? (
                        <span className="absolute inset-x-0 bottom-0 bg-black/70 px-1 py-0.5 text-center text-[0.5rem] font-black uppercase tracking-[0.08em] text-white">
                          Primary
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-zinc-400">No images</p>
              )}
            </td>
            <td className="px-4 py-4">
              <CategoryBadge
                category={product.categoryRecord?.nameEn ?? "Uncategorized"}
              />
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
              {/* Variants Section */}
              <div className="sm:col-span-2 border border-zinc-200 p-4 bg-zinc-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-950">Product Variants</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">Manage product sizing, colors, pricing adjustments, and availability.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => appendVariant({ size: "", colorVi: "", colorEn: "", priceAdjustment: 0, isAvailable: true })}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider bg-zinc-900 text-white hover:bg-[#a72b1f] transition-colors"
                  >
                    <Plus size={14} /> Add Variant
                  </button>
                </div>

                {errors.variants?.message && (
                  <p className="text-xs font-bold text-red-600 mb-3">{errors.variants.message}</p>
                )}

                <div className="overflow-x-auto border border-zinc-200">
                  <table className="w-full text-left text-xs bg-white min-w-[500px]">
                    <thead className="bg-zinc-100 uppercase tracking-wider text-zinc-700 font-bold border-b border-zinc-200">
                      <tr>
                        <th className="px-3 py-2.5 w-[80px]">Size *</th>
                        <th className="px-3 py-2.5">Color (VI) *</th>
                        <th className="px-3 py-2.5">Color (EN)</th>
                        <th className="px-3 py-2.5 w-[140px]">Price Adj (VND)</th>
                        <th className="px-3 py-2.5 w-[80px] text-center">Available</th>
                        <th className="px-3 py-2.5 w-[60px] text-center">Remove</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {variantFields.map((field, index) => (
                        <tr key={field.id} className="hover:bg-zinc-50/50">
                          <td className="p-2">
                            <input
                              className="field py-1 px-2 text-xs w-full"
                              placeholder="e.g. M"
                              {...register(`variants.${index}.size` as const)}
                            />
                            {errors.variants?.[index]?.size?.message && (
                              <p className="text-[10px] text-red-600 mt-0.5">{errors.variants[index].size.message}</p>
                            )}
                          </td>
                          <td className="p-2">
                            <input
                              className="field py-1 px-2 text-xs w-full"
                              placeholder="e.g. Đen"
                              {...register(`variants.${index}.colorVi` as const)}
                            />
                            {errors.variants?.[index]?.colorVi?.message && (
                              <p className="text-[10px] text-red-600 mt-0.5">{errors.variants[index].colorVi.message}</p>
                            )}
                          </td>
                          <td className="p-2">
                            <input
                              className="field py-1 px-2 text-xs w-full"
                              placeholder="e.g. Black"
                              {...register(`variants.${index}.colorEn` as const)}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              className="field py-1 px-2 text-xs w-full"
                              {...register(`variants.${index}.priceAdjustment` as const, { valueAsNumber: true })}
                            />
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="checkbox"
                              className="size-4 rounded border-zinc-300 text-[#a72b1f] focus:ring-[#a72b1f] cursor-pointer"
                              {...register(`variants.${index}.isAvailable` as const)}
                            />
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeVariant(index)}
                              className="text-zinc-400 hover:text-red-600 p-1 transition-colors inline-flex items-center justify-center"
                              title="Remove variant"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {variantFields.length === 0 && (
                    <div className="p-6 text-center text-zinc-500 bg-white">
                      No variants added. Click "Add Variant" to create one.
                    </div>
                  )}
                </div>
              </div>

              {/* Size Chart Section */}
              <div className="sm:col-span-2 border border-zinc-200 p-4 bg-zinc-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-950">Product Size Chart</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">Define detailed measurements for each size size chart reference.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => appendSizeChart({ size: "", shoulder: undefined, chest: undefined, length: undefined, sleeve: undefined, unit: "cm" })}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider bg-zinc-900 text-white hover:bg-[#a72b1f] transition-colors"
                  >
                    <Plus size={14} /> Add Size Row
                  </button>
                </div>

                {errors.sizeCharts?.message && (
                  <p className="text-xs font-bold text-red-600 mb-3">{errors.sizeCharts.message}</p>
                )}

                <div className="overflow-x-auto border border-zinc-200">
                  <table className="w-full text-left text-xs bg-white min-w-[500px]">
                    <thead className="bg-zinc-100 uppercase tracking-wider text-zinc-700 font-bold border-b border-zinc-200">
                      <tr>
                        <th className="px-3 py-2.5 w-[80px]">Size *</th>
                        <th className="px-3 py-2.5">Shoulder</th>
                        <th className="px-3 py-2.5">Chest</th>
                        <th className="px-3 py-2.5">Length</th>
                        <th className="px-3 py-2.5">Sleeve</th>
                        <th className="px-3 py-2.5 w-[80px]">Unit</th>
                        <th className="px-3 py-2.5 w-[60px] text-center">Remove</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {sizeChartFields.map((field, index) => (
                        <tr key={field.id} className="hover:bg-zinc-50/50">
                          <td className="p-2">
                            <input
                              className="field py-1 px-2 text-xs w-full"
                              placeholder="e.g. M"
                              {...register(`sizeCharts.${index}.size` as const)}
                            />
                            {errors.sizeCharts?.[index]?.size?.message && (
                              <p className="text-[10px] text-red-600 mt-0.5">{errors.sizeCharts[index].size.message}</p>
                            )}
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="any"
                              className="field py-1 px-2 text-xs w-full"
                              placeholder="cm / in"
                              {...register(`sizeCharts.${index}.shoulder` as const, {
                                setValueAs: (value) => (value === "" || value === null || value === undefined ? undefined : Number(value))
                              })}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="any"
                              className="field py-1 px-2 text-xs w-full"
                              placeholder="cm / in"
                              {...register(`sizeCharts.${index}.chest` as const, {
                                setValueAs: (value) => (value === "" || value === null || value === undefined ? undefined : Number(value))
                              })}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="any"
                              className="field py-1 px-2 text-xs w-full"
                              placeholder="cm / in"
                              {...register(`sizeCharts.${index}.length` as const, {
                                setValueAs: (value) => (value === "" || value === null || value === undefined ? undefined : Number(value))
                              })}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="any"
                              className="field py-1 px-2 text-xs w-full"
                              placeholder="cm / in"
                              {...register(`sizeCharts.${index}.sleeve` as const, {
                                setValueAs: (value) => (value === "" || value === null || value === undefined ? undefined : Number(value))
                              })}
                            />
                          </td>
                          <td className="p-2">
                            <select
                              className="field py-1 px-2 text-xs w-full font-bold"
                              {...register(`sizeCharts.${index}.unit` as const)}
                            >
                              <option value="cm">cm</option>
                              <option value="inch">inch</option>
                            </select>
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeSizeChart(index)}
                              className="text-zinc-400 hover:text-red-600 p-1 transition-colors inline-flex items-center justify-center"
                              title="Remove row"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {sizeChartFields.length === 0 && (
                    <div className="p-6 text-center text-zinc-500 bg-white">
                      No size chart measurements added. Click "Add Size Row" to create one.
                    </div>
                  )}
                </div>
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
                  <label
                    aria-disabled={isUploading || imageUploadLimitReached}
                    className={`mb-3 flex min-h-32 flex-col items-center justify-center border border-dashed p-5 text-center transition-colors ${
                      imageUploadLimitReached
                        ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400"
                        : "cursor-pointer border-zinc-300 bg-zinc-50 hover:border-[#a72b1f] hover:bg-red-50/40"
                    }`}
                  >
                    <ImagePlus className="text-[#a72b1f]" size={28} />
                    <span className="mt-3 text-sm font-bold">
                      {isUploading
                        ? "Uploading images..."
                        : imageUploadLimitReached
                          ? "Image limit reached"
                          : "Upload product images"}
                    </span>
                    <span className="mt-1 text-xs text-zinc-500">
                      JPG, PNG or WebP. Max 5 MB per image. {imageUrls.length}/
                      {MAX_PRODUCT_IMAGES} images.
                    </span>
                    <input
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      disabled={isUploading || imageUploadLimitReached}
                      multiple
                      onChange={(event) => {
                        void uploadProductImages(event.target.files);
                        event.target.value = "";
                      }}
                      type="file"
                    />
                  </label>
                  {imageUrls.length > 0 && (
                    <div className="mb-3 grid gap-3 sm:grid-cols-2">
                      {imageUrls.map((url, index) => (
                        <div
                          className="grid gap-3 border border-zinc-200 bg-white p-2 sm:grid-cols-[96px_1fr]"
                          key={`${url}-${index}`}
                        >
                          <div className="relative aspect-square overflow-hidden bg-zinc-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              alt={`Product preview ${index + 1}`}
                              className="h-full w-full object-cover"
                              src={url}
                            />
                            {index === 0 ? (
                              <span className="absolute bottom-1 left-1 bg-black/70 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.08em] text-white">
                                Primary
                              </span>
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-zinc-900">
                              Image {index + 1}
                            </p>
                            <p className="mt-1 truncate text-[0.65rem] text-zinc-500">
                              {url}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                aria-label={`Move image ${index + 1} earlier`}
                                className="grid size-8 place-items-center border border-zinc-300 bg-white text-zinc-800 transition-colors hover:border-zinc-900 hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-300"
                                disabled={index === 0}
                                onClick={() =>
                                  updateImageUrls(
                                    moveProductImageUrl(
                                      imageUrls,
                                      index,
                                      "earlier"
                                    )
                                  )
                                }
                                title="Move earlier"
                                type="button"
                              >
                                <ChevronLeft size={15} />
                              </button>
                              <button
                                aria-label={`Move image ${index + 1} later`}
                                className="grid size-8 place-items-center border border-zinc-300 bg-white text-zinc-800 transition-colors hover:border-zinc-900 hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-300"
                                disabled={index === imageUrls.length - 1}
                                onClick={() =>
                                  updateImageUrls(
                                    moveProductImageUrl(
                                      imageUrls,
                                      index,
                                      "later"
                                    )
                                  )
                                }
                                title="Move later"
                                type="button"
                              >
                                <ChevronRight size={15} />
                              </button>
                              <button
                                aria-label={`Set image ${index + 1} as primary`}
                                className="min-h-8 border border-zinc-300 bg-white px-2 text-[0.65rem] font-bold uppercase tracking-[0.08em] text-zinc-800 transition-colors hover:border-zinc-900 hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-300"
                                disabled={index === 0}
                                onClick={() =>
                                  updateImageUrls(
                                    setPrimaryProductImageUrl(imageUrls, index)
                                  )
                                }
                                title="Set as primary"
                                type="button"
                              >
                                Primary
                              </button>
                              <button
                                aria-label={`Remove image ${index + 1}`}
                                className="grid size-8 place-items-center border border-red-200 bg-white text-red-700 transition-colors hover:border-red-700 hover:bg-red-700 hover:text-white"
                                onClick={() =>
                                  updateImageUrls(
                                    removeProductImageUrl(imageUrls, index)
                                  )
                                }
                                title="Remove image"
                                type="button"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <textarea
                    className="field min-h-12 text-xs text-zinc-400"
                    placeholder="Image URLs (one per line) — or upload above"
                    {...register("images")}
                  />
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
