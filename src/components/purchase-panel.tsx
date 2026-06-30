"use client";

import { ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ZALO_URL } from "@/lib/constants";
import { findAvailableProductVariant } from "@/lib/product-catalog";
import { productVariantPrice } from "@/lib/product-pricing";
import { cn } from "@/lib/utils";
import { ZaloIcon } from "./brand-icons";
import { useCart } from "./cart-provider";
import { InternationalShippingNotice } from "./international-shipping-notice";

type ShippingRegion = "VIETNAM" | "KOREA" | "TAIWAN" | "JAPAN";
type PurchasePanelVariant = {
  id: string;
  size: string;
  colorVi: string;
  colorEn: string;
  priceAdjustment: number;
  isAvailable: boolean;
};

export function PurchasePanel({
  productId,
  productSlug,
  productName,
  productPrice,
  imageUrl,
  sizes,
  colors,
  variants,
  labels,
  isOutOfStock = false
}: {
  productId: string;
  productSlug: string;
  productName: string;
  productPrice: number;
  imageUrl?: string;
  sizes: string[];
  colors: string[];
  variants?: PurchasePanelVariant[];
  labels: {
    size: string;
    color: string;
    shipping: string;
    order: string;
    zalo: string;
    selectOptions: string;
    internationalTitle: string;
    internationalBody: string;
  };
  isOutOfStock?: boolean;
}) {
  const router = useRouter();
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [region, setRegion] = useState<ShippingRegion>("VIETNAM");
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  function selectedVariant() {
    return findAvailableProductVariant(variants, size, color);
  }

  function validateSelection() {
    if (!size || !color) {
      setError(labels.selectOptions);
      return false;
    }
    if (!selectedVariant()) {
      setError(labels.selectOptions);
      return false;
    }
    setError("");
    return true;
  }

  function proceed() {
    if (!validateSelection()) {
      return;
    }
    const variant = selectedVariant();
    if (!variant?.id) {
      setError(labels.selectOptions);
      return;
    }
    if (region !== "VIETNAM") {
      // Redirect to the international consultation page with pre-filled context.
      const params = new URLSearchParams({
        product: productName,
        size: size,
        color: color,
        region
      });
      router.push(`/international?${params.toString()}`);
      return;
    }
    const params = new URLSearchParams({ productId, size, color });
    params.set("variantId", variant.id);
    router.push(`/checkout?${params.toString()}`);
  }

  function addToCart() {
    if (!validateSelection()) {
      return;
    }
    const variant = selectedVariant();
    if (!variant?.id) {
      setError(labels.selectOptions);
      return;
    }
    addItem({
      productId,
      productVariantId: variant.id,
      slug: productSlug,
      name: productName,
      price: productVariantPrice({ basePrice: productPrice }, variant),
      imageUrl,
      size,
      color,
      quantity: 1
    });
    setAdded(true);
  }

  return (
    <div className="space-y-6">
      <OptionGroup
        label={labels.size}
        onChange={setSize}
        options={sizes}
        value={size}
      />
      <OptionGroup
        label={labels.color}
        onChange={setColor}
        options={colors}
        value={color}
      />
      <label className="block">
        <span className="label">{labels.shipping}</span>
        <select
          className="field"
          onChange={(event) =>
            setRegion(event.target.value as ShippingRegion)
          }
          value={region}
        >
          <option value="VIETNAM">Vietnam</option>
          <option value="KOREA">Korea</option>
          <option value="TAIWAN">Taiwan</option>
          <option value="JAPAN">Japan</option>
        </select>
      </label>

      {region !== "VIETNAM" ? (
        <InternationalShippingNotice
          body={labels.internationalBody}
          title={labels.internationalTitle}
        />
      ) : null}
      {error ? <p className="error-text">{error}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          className="button-secondary"
          onClick={addToCart}
          type="button"
          disabled={isOutOfStock}
        >
          <ShoppingCart aria-hidden="true" size={17} />
          {isOutOfStock ? "Hết hàng / Out of stock" : added ? "Đã thêm" : "Thêm vào giỏ"}
        </button>
        <button
          className="button-primary"
          onClick={proceed}
          type="button"
          disabled={isOutOfStock}
        >
          <ShoppingCart aria-hidden="true" size={17} />
          {isOutOfStock ? "Hết hàng / Out of stock" : labels.order}
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-1">
        <a
          className="button-secondary"
          href={`${ZALO_URL}?text=${encodeURIComponent(`Product consultation: ${productName}`)}`}
          rel="noreferrer"
          target="_blank"
        >
          <ZaloIcon size={17} />
          {labels.zalo}
        </a>
      </div>
    </div>
  );
}

function OptionGroup({
  label,
  options,
  value,
  onChange
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            className={cn(
              "min-w-12 border px-4 py-2 text-xs font-bold uppercase",
              value === option
                ? "border-black bg-black text-white"
                : "border-zinc-300 bg-white hover:border-black"
            )}
            key={option}
            onClick={() => onChange(option)}
            type="button"
          >
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
