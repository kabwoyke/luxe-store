"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Truck } from "lucide-react";
import { toast } from "sonner";
import type { DetailProduct } from "@/lib/detail-product";
import { addToCart } from "@/lib/cart";
import { formatKES } from "@/lib/format";
import { kesLabel } from "@/lib/pricing";
import {
  CATEGORIES,
  findVariant,
  galleryForColor,
  highlightChips,
  variantColors,
  variantSizes,
} from "@/lib/product-options";
import { useCartDrawer } from "@/components/cart/cart-drawer-provider";
import { WishlistButton } from "@/components/shop/wishlist-button";
import { ColorGallery } from "./color-gallery";
import { VariantPicker } from "./variant-picker";

const LOW_STOCK = 5;

export function ProductView({
  product,
  initialColor,
  freeDeliveryThreshold,
}: {
  product: DetailProduct;
  initialColor?: string;
  freeDeliveryThreshold: number;
}) {
  const router = useRouter();
  const { setOpen: openCart } = useCartDrawer();

  const colors = useMemo(() => variantColors(product.variants), [product.variants]);
  const sizes = useMemo(() => variantSizes(product.variants, product.category), [product.variants, product.category]);
  const cfg = CATEGORIES[product.category];
  const sizeLabel = cfg?.sizeLabel ?? "Size";
  const sizeNoun = sizeLabel.split(/[ (/]/)[0].toLowerCase();

  const [color, setColor] = useState<string | undefined>(initialColor);
  const [size, setSize] = useState<string | undefined>();
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const hasColors = colors.length > 0;
  const hasSizes = sizes.length > 0;
  const hasOptions = product.variants.length > 0;

  const variant = hasOptions && (!hasColors || color) && (!hasSizes || size)
    ? (findVariant(product.variants, hasColors ? color : undefined, hasSizes ? size : undefined) ?? null)
    : null;
  const available = hasOptions ? (variant?.stock ?? 0) : product.stock;
  const maxQty = Math.max(1, variant?.stock ?? product.stock);
  const soldOut = product.stock <= 0;

  const images = galleryForColor(product, color);
  const allImages = useMemo(
    () => [
      ...new Set([
        ...galleryForColor(product, undefined),
        ...colors.flatMap((c) => galleryForColor(product, c)),
      ]),
    ],
    [product, colors]
  );

  function chooseColor(next: string) {
    setColor(next);
    setError(null);
    // Keep the chosen size only if that combination is in stock for the new colour.
    if (size && (findVariant(product.variants, next, size)?.stock ?? 0) <= 0) setSize(undefined);
    setQty(1);
    // Shareable link without navigating or adding history entries.
    const url = new URL(window.location.href);
    url.searchParams.set("color", next);
    window.history.replaceState(window.history.state, "", url);
  }

  function chooseSize(next: string) {
    setSize(next);
    setError(null);
    setQty(1);
  }

  /** Returns true when the selection is complete and the line was added. */
  function add(): boolean {
    if (hasOptions) {
      const missing = hasColors && !color ? "color" : hasSizes && !size ? sizeNoun : null;
      if (missing) {
        const message = `Please select a ${missing}`;
        setError(message);
        toast.error(message);
        return false;
      }
    }
    const result = addToCart(product, variant, qty);
    if (!result.ok) {
      toast.error("Sorry, that option is sold out.");
      return false;
    }
    toast.success(result.capped ? `Cart updated. Only ${result.qty} available in this option.` : "Added to cart");
    return true;
  }

  const chips = highlightChips(product);

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <ColorGallery name={product.name} images={images} allImages={allImages} colorKey={color ?? "default"} />

      <div className="space-y-6">
        <div className="space-y-2">
          {product.brand && <p className="micro-label text-mauve">{product.brand}</p>}
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{product.name}</h1>
          <p className="text-2xl font-bold text-mauve">{formatKES(product.price)}</p>
          {product.shortDescription && <p className="text-body">{product.shortDescription}</p>}
        </div>

        {chips.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {chips.map((chip) => (
              <li key={chip} className="rounded-full bg-blush px-3 py-1 text-xs font-semibold text-mauve-dark">
                {chip}
              </li>
            ))}
          </ul>
        )}

        {hasOptions && (
          <VariantPicker
            product={product}
            sizeLabel={sizeLabel}
            color={color}
            size={size}
            onColor={chooseColor}
            onSize={chooseSize}
            error={error}
          />
        )}

        <div className="min-h-5 text-sm" aria-live="polite">
          {soldOut ? (
            <p className="font-semibold text-destructive">Sold out</p>
          ) : variant && variant.stock > 0 && variant.stock <= LOW_STOCK ? (
            <p className="font-semibold text-warn">Only {variant.stock} left in this option</p>
          ) : variant && variant.stock === 0 ? (
            <p className="font-semibold text-destructive">This option is sold out</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-full border border-border bg-white">
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={qty <= 1}
              onClick={() => setQty((q) => q - 1)}
              className="grid size-12 place-items-center rounded-full text-ink disabled:opacity-40"
            >
              <Minus className="size-4" />
            </button>
            <span className="min-w-8 text-center font-semibold" aria-live="polite">
              {qty}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              disabled={qty >= maxQty}
              onClick={() => setQty((q) => q + 1)}
              className="grid size-12 place-items-center rounded-full text-ink disabled:opacity-40"
            >
              <Plus className="size-4" />
            </button>
          </div>
          <WishlistButton productId={product.id} className="size-12 border border-border" />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={soldOut || (!!variant && available <= 0)}
            onClick={() => {
              if (add()) openCart(true);
            }}
            className="h-12 flex-1 rounded-full bg-ink px-6 text-sm font-semibold text-white transition-colors hover:bg-ink-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add to cart
          </button>
          <button
            type="button"
            disabled={soldOut || (!!variant && available <= 0)}
            onClick={() => {
              if (add()) router.push("/checkout");
            }}
            className="h-12 flex-1 rounded-full bg-linear-to-r from-pink-500 to-purple-600 px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Buy now
          </button>
        </div>

        <p className="flex items-center gap-2 text-sm text-muted-ink">
          <Truck className="size-4 shrink-0" /> Free delivery across Kenya on orders over {kesLabel(freeDeliveryThreshold)}. Pay with M-Pesa.
        </p>
      </div>
    </div>
  );
}
