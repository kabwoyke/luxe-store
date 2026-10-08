"use client";

import { cn } from "@/lib/utils";
import {
  colorStock,
  findVariant,
  productColorCss,
  variantColors,
  variantSizes,
  type ProductLike,
} from "@/lib/product-options";

type PickerProduct = Pick<ProductLike, "category" | "variants">;

export function VariantPicker({
  product,
  sizeLabel,
  color,
  size,
  onColor,
  onSize,
  error,
}: {
  product: PickerProduct;
  /** e.g. "Length (inches)" or "Size (EU)". */
  sizeLabel: string;
  color?: string;
  size?: string;
  onColor: (color: string) => void;
  onSize: (size: string) => void;
  /** Inline message shown when the buyer tried to add without a complete selection. */
  error?: string | null;
}) {
  const colors = variantColors(product.variants);
  const sizes = variantSizes(product.variants, product.category);
  const hasColors = colors.length > 0;

  // A size is available when that (colour, size) combination has stock.
  const available = (s: string) =>
    (findVariant(product.variants, hasColors ? color : undefined, s)?.stock ?? 0) > 0;

  return (
    <div className="space-y-5">
      {hasColors && (
        <fieldset>
          <legend className="mb-2 text-sm text-body">
            Color: <span className="font-semibold text-ink">{color}</span>
          </legend>
          <div className="-ml-1 flex flex-wrap">
            {colors.map((c) => {
              const out = colorStock(product.variants, c) === 0;
              const selected = c === color;
              return (
                <button
                  key={c}
                  type="button"
                  title={out ? `${c} (sold out)` : c}
                  aria-label={out ? `${c}, sold out` : c}
                  aria-pressed={selected}
                  onClick={() => onColor(c)}
                  className="grid size-10 place-items-center rounded-full"
                >
                  <span
                    className={cn(
                      "relative block size-8 overflow-hidden rounded-full border border-black/10",
                      selected && "ring-2 ring-mauve ring-offset-2"
                    )}
                    style={{ background: productColorCss(product, c) }}
                  >
                    {out && (
                      <span className="absolute left-1/2 top-1/2 h-px w-10 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-ink/70" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {sizes.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-sm text-body">
            {sizeLabel}: <span className="font-semibold text-ink">{size ?? "Select"}</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => {
              const ok = available(s);
              const selected = s === size;
              return (
                <button
                  key={s}
                  type="button"
                  disabled={!ok}
                  aria-pressed={selected}
                  aria-label={ok ? s : `${s}, sold out`}
                  onClick={() => onSize(s)}
                  className={cn(
                    "min-h-10 min-w-12 rounded-full border px-4 text-sm font-medium transition-colors",
                    selected
                      ? "border-ink bg-ink text-white"
                      : "border-border bg-white text-body hover:border-mauve hover:text-mauve",
                    !ok && "cursor-not-allowed border-border bg-blush/60 text-muted-ink/60 line-through hover:border-border hover:text-muted-ink/60"
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
