"use client";

import { createPersistentStore } from "@/lib/persistent-store";
import { variantImage, variantLabel, type Variant, type ProductLike } from "@/lib/product-options";

/**
 * Cart lines are keyed by product + variant. The snapshot here is only for display:
 * the server re-fetches prices and stock when an order is created.
 */
export type CartItem = {
  key: string;
  productId: number;
  variantId: string | null;
  name: string;
  price: number;
  image: string;
  /** "Color / Size", or null for products without options. */
  label: string | null;
  qty: number;
  /** Stock at the time it was added; caps the quantity stepper. */
  maxQty: number;
};

const EMPTY: CartItem[] = [];

const isCart = (v: unknown): v is CartItem[] =>
  Array.isArray(v) &&
  v.every(
    (i) =>
      i && typeof i.key === "string" && typeof i.productId === "number" && typeof i.qty === "number" && typeof i.price === "number"
  );

const store = createPersistentStore<CartItem[]>("luxe-cart", EMPTY, isCart);

export const cartKey = (productId: number, variantId: string | null) => `${productId}:${variantId ?? "base"}`;

export function useCart() {
  const items = store.use();
  return {
    items,
    count: items.reduce((n, i) => n + i.qty, 0),
    subtotal: items.reduce((n, i) => n + i.price * i.qty, 0),
  };
}

export type AddResult = { ok: true; qty: number; capped: boolean } | { ok: false; reason: "sold-out" };

type CartProduct = Pick<ProductLike, "name" | "imageUrl" | "images" | "colorImages"> & { id: number; price: number; stock: number };

/** Adds a line, never exceeding the stock of that variant. */
export function addToCart(product: CartProduct, variant: Variant | null, qty = 1): AddResult {
  const available = variant ? variant.stock : product.stock;
  const key = cartKey(product.id, variant?.id ?? null);
  const items = store.get();
  const existing = items.find((i) => i.key === key);
  const wanted = (existing?.qty ?? 0) + qty;
  const finalQty = Math.min(wanted, available);
  if (finalQty <= 0) return { ok: false, reason: "sold-out" };

  const line: CartItem = {
    key,
    productId: product.id,
    variantId: variant?.id ?? null,
    name: product.name,
    price: product.price,
    image: variant ? variantImage(product, variant.color) : product.imageUrl,
    label: variant ? variantLabel(variant) || null : null,
    qty: finalQty,
    maxQty: available,
  };
  store.set(existing ? items.map((i) => (i.key === key ? line : i)) : [...items, line]);
  return { ok: true, qty: finalQty, capped: finalQty < wanted };
}

export function setCartQty(key: string, qty: number) {
  store.set(
    store
      .get()
      .map((i) => (i.key === key ? { ...i, qty: Math.max(1, Math.min(qty, i.maxQty)) } : i))
  );
}

export function removeFromCart(key: string) {
  store.set(store.get().filter((i) => i.key !== key));
}

export function clearCart() {
  store.set(EMPTY);
}
