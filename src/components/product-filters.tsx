"use client";

import { ChevronDown, SlidersHorizontal, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import type { Locale } from "@/i18n/request";
import {
  productMatchesVariantFilters,
  productVariantColors,
  productVariantSizes
} from "@/lib/product-catalog";
import { productBasePrice } from "@/lib/product-pricing";
import type { CatalogProductDTO } from "@/types";
import { Money } from "./money";
import { ProductGrid } from "./product-grid";

const maximumPrice = 5000000;

export function ProductFilters({
  products,
  locale,
  labels
}: {
  products: CatalogProductDTO[];
  locale: Locale;
  labels: {
    filters: string;
    all: string;
    category: string;
    size: string;
    color: string;
    price: string;
    noResults: string;
    noImage: string;
    outOfStock: string;
    order: string;
    details: string;
  };
}) {
  const [category, setCategory] = useState("ALL");
  const [size, setSize] = useState("ALL");
  const [color, setColor] = useState("ALL");
  const [maxPrice, setMaxPrice] = useState(maximumPrice);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const categories = uniqueCategories(products);
  const sizes = [...new Set(products.flatMap((product) => productVariantSizes(product.variants)))];
  const colors = [...new Set(products.flatMap((product) => productVariantColors(product.variants)))];
  const activeFilterCount = [
    category !== "ALL",
    size !== "ALL",
    color !== "ALL",
    maxPrice < maximumPrice
  ].filter(Boolean).length;

  const filtered = useMemo(
    () =>
      products.filter(
        (product) =>
          product.stockStatus === "IN_STOCK" &&
          (category === "ALL" || product.categoryId === category) &&
          productMatchesVariantFilters(product.variants, { size, color }) &&
          productBasePrice(product) <= maxPrice
      ),
    [category, color, maxPrice, products, size]
  );

  const pageCount = Math.ceil(filtered.length / pageSize);
  const activePage = Math.min(currentPage, Math.max(1, pageCount));

  const paginated = useMemo(
    () => {
      const start = (activePage - 1) * pageSize;
      return filtered.slice(start, start + pageSize);
    },
    [filtered, activePage, pageSize]
  );

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  function resetFilters() {
    setCategory("ALL");
    setSize("ALL");
    setColor("ALL");
    setMaxPrice(maximumPrice);
    setCurrentPage(1);
  }

  return (
    <div className="grid gap-7 lg:grid-cols-[240px_1fr] xl:grid-cols-[260px_1fr] lg:gap-10 xl:gap-12">
      <aside className="min-w-0">
        <button
          aria-expanded={filtersOpen}
          className="flex min-h-12 w-full items-center justify-between border-y border-black px-1 text-left lg:hidden"
          onClick={() => setFiltersOpen((open) => !open)}
          type="button"
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal size={16} />
            <span className="text-xs font-black uppercase tracking-[0.14em]">
              {labels.filters}
            </span>
            {activeFilterCount > 0 ? (
              <span className="grid size-5 place-items-center rounded-full bg-[#a72b1f] text-[10px] font-black text-white">
                {activeFilterCount}
              </span>
            ) : null}
          </span>
          <ChevronDown
            className={`transition-transform ${filtersOpen ? "rotate-180" : ""}`}
            size={18}
          />
        </button>

        <div
          className={`${filtersOpen ? "block" : "hidden"} border-b border-black/15 lg:block lg:border-0`}
        >
          <div className="hidden items-center gap-2 border-b border-black pb-4 lg:flex">
            <SlidersHorizontal size={16} />
            <p className="eyebrow">{labels.filters}</p>
          </div>
          <div className="grid gap-4 py-5 sm:grid-cols-2 lg:grid-cols-1 lg:gap-6 lg:py-6">
            <FilterSelect
              allLabel={labels.all}
              label={labels.category}
              onChange={(value) => {
                setCategory(value);
                setCurrentPage(1);
              }}
              options={categories.map((item) => ({
                value: item.id,
                label: locale === "vi" ? item.nameVi : item.nameEn
              }))}
              value={category}
            />
            <FilterSelect
              allLabel={labels.all}
              label={labels.size}
              onChange={(value) => {
                setSize(value);
                setCurrentPage(1);
              }}
              options={sizes.map((item) => ({ value: item, label: item }))}
              value={size}
            />
            <FilterSelect
              allLabel={labels.all}
              label={labels.color}
              onChange={(value) => {
                setColor(value);
                setCurrentPage(1);
              }}
              options={colors.map((item) => ({ value: item, label: item }))}
              value={color}
            />
            <label className="block">
              <span className="label">{labels.price}</span>
              <input
                className="w-full accent-black"
                max={maximumPrice}
                min="500000"
                onChange={(event) => {
                  setMaxPrice(Number(event.target.value));
                  setCurrentPage(1);
                }}
                step="100000"
                type="range"
                value={maxPrice}
              />
              <span className="mt-2 block text-xs font-bold">
                ≤ <Money amountVnd={maxPrice} />
              </span>
            </label>
          </div>
          {activeFilterCount > 0 ? (
            <button
              className="mb-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-[#a72b1f] lg:mb-0"
              onClick={resetFilters}
              type="button"
            >
              <X size={14} />
              {labels.all}
            </button>
          ) : null}
        </div>
      </aside>

      <section className="min-w-0">
        {paginated.length ? (
          <>
            <ProductGrid
              detailsLabel={labels.details}
              locale={locale}
              noImageLabel={labels.noImage}
              orderLabel={labels.order}
              outOfStockLabel={labels.outOfStock}
              products={paginated}
            />
            {pageCount > 1 ? (
              <div className="mt-12 flex flex-col gap-4 border-t border-black/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  {locale === "vi"
                    ? `Hiển thị ${(activePage - 1) * pageSize + 1}–${Math.min(activePage * pageSize, filtered.length)} trên tổng số ${filtered.length} sản phẩm`
                    : `Showing ${(activePage - 1) * pageSize + 1}–${Math.min(activePage * pageSize, filtered.length)} of ${filtered.length} products`}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    aria-label="Previous page"
                    className="grid size-9 place-items-center border border-zinc-300 bg-white text-zinc-800 transition-colors hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-300"
                    disabled={activePage === 1}
                    onClick={() => handlePageChange(activePage - 1)}
                    type="button"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="min-w-24 text-center text-xs font-bold text-zinc-700">
                    {locale === "vi"
                      ? `Trang ${activePage} / ${pageCount}`
                      : `Page ${activePage} / ${pageCount}`}
                  </span>
                  <button
                    aria-label="Next page"
                    className="grid size-9 place-items-center border border-zinc-300 bg-white text-zinc-800 transition-colors hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-300"
                    disabled={activePage === pageCount}
                    onClick={() => handlePageChange(activePage + 1)}
                    type="button"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <div className="border border-dashed border-zinc-400 p-12 text-center text-sm text-zinc-600">
            {labels.noResults}
          </div>
        )}
      </section>
    </div>
  );
}

function uniqueCategories(products: CatalogProductDTO[]) {
  const categories = new Map<string, NonNullable<CatalogProductDTO["categoryRecord"]>>();
  for (const product of products) {
    if (product.categoryRecord) {
      categories.set(product.categoryRecord.id, product.categoryRecord);
    }
  }

  return [...categories.values()];
}

function FilterSelect({
  label,
  value,
  allLabel,
  options,
  onChange
}: {
  label: string;
  value: string;
  allLabel: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <select
        className="field"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="ALL">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
