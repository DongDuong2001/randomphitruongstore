"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  cartStorageKeyForOwner,
  legacyCartStorageKey,
  parseStoredCartItems
} from "@/lib/cart-storage";
import { useAuth } from "@/context/auth-context";

export type CartItem = {
  productId: string;
  productVariantId?: string;
  slug: string;
  name: string;
  price: number;
  imageUrl?: string;
  size: string;
  color: string;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  hydrated: boolean;
  subtotal: number;
  addItem: (item: CartItem) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
  itemKey: (
    item: Pick<CartItem, "productId" | "productVariantId" | "size" | "color">
  ) => string;
};

const CartContext = createContext<CartContextValue | null>(null);

export function cartItemKey({
  productId,
  productVariantId,
  size,
  color
}: Pick<CartItem, "productId" | "productVariantId" | "size" | "color">) {
  return `${productId}:${productVariantId ?? "legacy"}:${size}:${color}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const ownerId = user?.id ?? null;
  const signedIn = Boolean(user);
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [activeStorageKey, setActiveStorageKey] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    let cancelled = false;

    const storageKey = cartStorageKeyForOwner(ownerId);
    const stored = window.localStorage.getItem(storageKey);
    const legacyStored =
      !signedIn && !stored ? window.localStorage.getItem(legacyCartStorageKey) : null;
    const nextItems = parseStoredCartItems(stored ?? legacyStored);

    if (!signedIn && legacyStored && !stored) {
      window.localStorage.setItem(storageKey, legacyStored);
      window.localStorage.removeItem(legacyCartStorageKey);
    }

    queueMicrotask(() => {
      if (cancelled) {
        return;
      }
      setItems(nextItems);
      setActiveStorageKey(storageKey);
      setHydrated(true);
    });

    return () => {
      cancelled = true;
    };
  }, [authLoading, ownerId, signedIn]);

  useEffect(() => {
    if (!hydrated || !activeStorageKey) {
      return;
    }

    window.localStorage.setItem(activeStorageKey, JSON.stringify(items));
  }, [activeStorageKey, hydrated, items]);

  const addItem = useCallback((item: CartItem) => {
    setItems((current) => {
      const key = cartItemKey(item);
      const existing = current.find((entry) => cartItemKey(entry) === key);
      if (!existing) {
        return [...current, item];
      }

      return current.map((entry) =>
        cartItemKey(entry) === key
          ? { ...entry, quantity: entry.quantity + item.quantity }
          : entry
      );
    });
  }, []);

  const updateQuantity = useCallback((key: string, quantity: number) => {
    setItems((current) =>
      current
        .map((item) =>
          cartItemKey(item) === key
            ? { ...item, quantity: Math.max(1, quantity) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((current) => current.filter((item) => cartItemKey(item) !== key));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((total, item) => total + item.quantity, 0),
      hydrated,
      subtotal: items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      ),
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      itemKey: cartItemKey
    }),
    [addItem, clearCart, hydrated, items, removeItem, updateQuantity]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
