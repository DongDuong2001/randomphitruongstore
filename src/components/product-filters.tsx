"use client";

import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { Locale } from "@/i18n/request";
import { categoryLabel } from "@/lib/format";
import type { ProductWithImages } from "@/types";
import { ProductGrid } from "./product-grid";

const categories = ["SUKAJAN", "BOMBER", "HOODIE", "JACKET", "SEASONAL"];
const maximumPrice = 5000000;

export function ProductFilters({
  products,
  locale,
  labels
}: {
  products: ProductWithImages[];
  locale: Locale;
  labels: {
    filters: string;
    all: string;
    category: string;
    size: string;
    color: string;
    price: string;
    noResults: string;
    order: string;
    details: string;
  };
}) {
  const [category, setCategory] = useState("ALL");
  const [size, setSize] = useState("ALL");
  const [color, setColor] = useState("ALL");
  const [maxPrice, setMaxPrice] = useState(maximumPrice);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const sizes = [...new Set(products.flatMap((product) => product.sizes))];
  const colors = [...new Set(products.flatMap((product) => product.colors))];
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
          (category === "ALL" || product.category === category) &&
          (size === "ALL" || product.sizes.includes(size)) &&
          (color === "ALL" || product.colors.includes(color)) &&
          product.price <= maxPrice
      ),
    [category, color, maxPrice, products, size]
  );

  function resetFilters() {
    setCategory("ALL");
    setSize("ALL");
    setColor("ALL");
    setMaxPrice(maximumPrice);
  }

  return (
    <div className="grid gap-7 lg:grid-cols-[240px_1fr] lg:gap-10">
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
              onChange={setCategory}
              options={categories.map((item) => ({
                value: item,
                label: categoryLabel(item, locale)
              }))}
              value={category}
            />
            <FilterSelect
              allLabel={labels.all}
              label={labels.size}
              onChange={setSize}
              options={sizes.map((item) => ({ value: item, label: item }))}
              value={size}
            />
            <FilterSelect
              allLabel={labels.all}
              label={labels.color}
              onChange={setColor}
              options={colors.map((item) => ({ value: item, label: item }))}
              value={color}
            />
            <label className="block">
              <span className="label">{labels.price}</span>
              <input
                className="w-full accent-black"
                max={maximumPrice}
                min="500000"
                onChange={(event) => setMaxPrice(Number(event.target.value))}
                step="100000"
                type="range"
                value={maxPrice}
              />
              <span className="mt-2 block text-xs font-bold">
                ≤ {new Intl.NumberFormat("vi-VN").format(maxPrice)} VND
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
        {filtered.length ? (
          <ProductGrid
            detailsLabel={labels.details}
            locale={locale}
            orderLabel={labels.order}
            products={filtered}
          />
        ) : (
          <div className="border border-dashed border-zinc-400 p-12 text-center text-sm text-zinc-600">
            {labels.noResults}
          </div>
        )}
      </section>
    </div>
  );
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
