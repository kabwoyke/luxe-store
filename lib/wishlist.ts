"use client";

import { createPersistentStore } from "@/lib/persistent-store";

const EMPTY: number[] = [];

const isIds = (v: unknown): v is number[] => Array.isArray(v) && v.every((n) => typeof n === "number");

const store = createPersistentStore<number[]>("luxe-wishlist", EMPTY, isIds);

export function useWishlist() {
  const ids = store.use();
  return { ids, has: (id: number) => ids.includes(id) };
}

/** Returns true when the product is now in the wishlist. */
export function toggleWishlist(id: number): boolean {
  const ids = store.get();
  if (ids.includes(id)) {
    store.set(ids.filter((i) => i !== id));
    return false;
  }
  store.set([...ids, id]);
  return true;
}
