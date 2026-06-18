import type { CartItem } from "@/components/cart-provider";

const baseCartStorageKey = "random.phitruong.cart.v1";

export const legacyCartStorageKey = baseCartStorageKey;

export function cartStorageKeyForOwner(ownerId: string | null | undefined) {
  return ownerId ? `${baseCartStorageKey}:user:${ownerId}` : `${baseCartStorageKey}:guest`;
}

export function parseStoredCartItems(value: string | null): CartItem[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter(isCartItem);
    }
  } catch {
    return [];
  }

  return [];
}

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Record<string, unknown>;
  return (
    typeof item.productId === "string" &&
    typeof item.slug === "string" &&
    typeof item.name === "string" &&
    typeof item.price === "number" &&
    typeof item.size === "string" &&
    typeof item.color === "string" &&
    typeof item.quantity === "number"
  );
}
