"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ProductImage } from "@/components/shop/product-image";

const SWIPE_PX = 40;

/**
 * Main image plus thumbnails for the selected colour.
 * Every photo of the product is stacked in the DOM, so swapping colour or thumbnail is a
 * cross-fade between images that are already loaded, never a blank flash.
 */
export function ColorGallery({
  name,
  images,
  allImages,
  colorKey,
}: {
  name: string;
  /** Photos of the selected colour (or the default gallery). */
  images: string[];
  /** Every distinct photo across all colours, rendered stacked for instant swaps. */
  allImages: string[];
  /** Changes with the selected colour; selecting a colour resets to its first photo. */
  colorKey: string;
}) {
  const [state, setState] = useState({ key: colorKey, index: 0 });
  // Switching colour starts again from that colour's first photo.
  if (state.key !== colorKey) setState({ key: colorKey, index: 0 });
  const index = state.key === colorKey ? Math.min(state.index, images.length - 1) : 0;
  const active = images[index];
  const startX = useRef<number | null>(null);

  const go = (next: number) => setState({ key: colorKey, index: (next + images.length) % images.length });

  function onPointerUp(clientX: number) {
    if (startX.current === null || images.length < 2) return;
    const delta = clientX - startX.current;
    startX.current = null;
    if (Math.abs(delta) >= SWIPE_PX) go(index + (delta < 0 ? 1 : -1));
  }

  return (
    <div className="space-y-3">
      <div
        className="relative aspect-square touch-pan-y overflow-hidden rounded-3xl border border-border bg-blush"
        onPointerDown={(e) => (startX.current = e.clientX)}
        onPointerUp={(e) => onPointerUp(e.clientX)}
        onPointerCancel={() => (startX.current = null)}
      >
        {allImages.map((src, i) => (
          <ProductImage
            key={src}
            src={src}
            alt={src === active ? name : ""}
            sizes="(min-width: 1024px) 50vw, 100vw"
            priority={i === 0}
            className={cn(
              "select-none object-cover transition-opacity duration-300",
              src === active ? "opacity-100" : "opacity-0"
            )}
          />
        ))}

        {images.length > 1 && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5 md:hidden" aria-hidden>
            {images.map((src, i) => (
              <span
                key={src}
                className={cn("size-2 rounded-full bg-white/60 shadow", i === index && "w-5 bg-white")}
              />
            ))}
          </div>
        )}
      </div>

      {images.length > 1 && (
        <ul className="no-scrollbar flex gap-2 overflow-x-auto" aria-label="Product photos">
          {images.map((src, i) => (
            <li key={src} className="shrink-0">
              <button
                type="button"
                onClick={() => go(i)}
                aria-label={`Show photo ${i + 1} of ${images.length}`}
                aria-current={i === index}
                className={cn(
                  "relative block size-16 overflow-hidden rounded-xl border-2 bg-blush sm:size-20",
                  i === index ? "border-mauve" : "border-transparent hover:border-border"
                )}
              >
                <ProductImage src={src} alt="" sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
