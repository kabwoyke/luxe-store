"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import type { CardProduct } from "@/lib/card-product";
import { useWishlist } from "@/lib/wishlist";
import { ProductCard } from "./product-card";

export function WishlistView({ products }: { products: CardProduct[] }) {
  const { ids } = useWishlist();
  const saved = products.filter((p) => ids.includes(p.id));

  if (saved.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-white px-6 py-16 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-blush text-mauve">
          <Heart className="size-6" />
        </span>
        <p className="mt-4 font-heading text-lg font-semibold text-ink">Your wishlist is empty</p>
        <p className="mt-1 text-sm text-body">Tap the heart on any product to save it for later.</p>
        <Link href="/shop" className="mt-5 inline-flex h-11 items-center rounded-full bg-ink px-6 text-sm font-semibold text-white hover:bg-ink-hover">
          Browse the shop
        </Link>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
      {saved.map((p) => (
        <li key={p.id} className="min-w-0">
          <ProductCard product={p} />
        </li>
      ))}
    </ul>
  );
}
