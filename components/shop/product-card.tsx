"use client";

import { useState } from "react";
import Link from "next/link";
import type { CardProduct } from "@/lib/card-product";
import { formatKES } from "@/lib/format";
import {
  cardHighlights,
  colorStock,
  productColorCss,
  variantColors,
} from "@/lib/product-options";
import { cn } from "@/lib/utils";
import { ProductImage } from "./product-image";
import { WishlistButton } from "./wishlist-button";

const MAX_DOTS = 5;
const SIZES = "(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, 50vw";

export function ProductCard({ product, priority }: { product: CardProduct; priority?: boolean }) {
  const [selected, setSelected] = useState<string | null>(null);

  const colors = variantColors(product.variants);
  const visible = colors.slice(0, MAX_DOTS);
  const hidden = colors.length - visible.length;
  const href = `/products/${product.id}${selected ? `?color=${encodeURIComponent(selected)}` : ""}`;
  const highlights = cardHighlights(product);
  const soldOut = product.stock <= 0;

  // Every colour's first photo is rendered stacked, so a swap never flashes blank.
  // Colours without their own photo share the default one, so layers are unique by src.
  const photoFor = (color?: string) => (color && product.colorImages[color]?.[0]) || product.imageUrl;
  const layers = [...new Set([photoFor(colors[0]), ...colors.map(photoFor)])];
  const activeSrc = photoFor(selected ?? colors[0]);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.25rem] border border-border bg-white shadow-[0_16px_40px_rgba(53,25,41,0.06)] sm:rounded-[1.6rem]">
      <div className="relative aspect-square overflow-hidden bg-blush">
        <Link href={href} className="absolute inset-0 block" aria-label={product.name}>
          {layers.map((src, i) => (
            <ProductImage
              key={src}
              src={src}
              alt={src === activeSrc ? product.name : ""}
              sizes={SIZES}
              priority={priority && i === 0}
              className={cn(
                "object-cover transition-opacity duration-300",
                src === activeSrc ? "opacity-100" : "opacity-0"
              )}
            />
          ))}
        </Link>
        <div className="pointer-events-none absolute left-2 top-2 flex flex-wrap gap-1">
          {soldOut ? (
            <Badge>Sold out</Badge>
          ) : (
            <>
              {product.newArrival && <Badge>New</Badge>}
              {product.bestSeller && <Badge tone="mauve">Best seller</Badge>}
            </>
          )}
        </div>
        <WishlistButton productId={product.id} className="absolute right-2 top-2" />
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        {colors.length > 0 && (
          <div className="-ml-1 flex items-center" role="group" aria-label="Colours">
            {visible.map((color) => {
              const out = colorStock(product.variants, color) === 0;
              const active = selected === color;
              return (
                <button
                  key={color}
                  type="button"
                  aria-label={`${color}${out ? " (sold out)" : ""}`}
                  aria-pressed={active}
                  title={color}
                  onClick={() => setSelected(active ? null : color)}
                  className="grid size-7 place-items-center rounded-full"
                >
                  <span
                    className={cn(
                      "relative block size-4 overflow-hidden rounded-full border border-black/10",
                      active && "ring-2 ring-mauve ring-offset-2"
                    )}
                    style={{ background: productColorCss(product, color) }}
                  >
                    {out && (
                      <span className="absolute left-1/2 top-1/2 h-px w-6 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-ink/70" />
                    )}
                  </span>
                </button>
              );
            })}
            {hidden > 0 && <span className="ml-1 text-xs text-muted-ink">+{hidden}</span>}
          </div>
        )}

        <Link href={href} className="line-clamp-2 font-heading text-sm font-semibold leading-snug text-ink hover:text-mauve sm:text-base">
          {product.name}
        </Link>
        {highlights && <p className="line-clamp-1 text-[11px] text-muted-ink sm:text-xs">{highlights}</p>}
        <p className="mt-auto pt-1 text-sm font-bold text-mauve sm:text-base">{formatKES(product.price)}</p>

        <Link
          href={href}
          className="mt-1 flex h-10 w-full items-center justify-center rounded-full bg-ink text-xs font-semibold text-white transition-colors hover:bg-ink-hover sm:text-sm"
        >
          {soldOut ? "View details" : colors.length || product.variants.length ? "Choose options" : "View product"}
        </Link>
      </div>
    </article>
  );
}

function Badge({ children, tone = "ink" }: { children: React.ReactNode; tone?: "ink" | "mauve" }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white",
        tone === "ink" ? "bg-ink/85" : "bg-mauve/90"
      )}
    >
      {children}
    </span>
  );
}
