"use client";

import { Heart } from "lucide-react";
import { toast } from "sonner";
import { toggleWishlist, useWishlist } from "@/lib/wishlist";
import { cn } from "@/lib/utils";

export function WishlistButton({
  productId,
  className,
}: {
  productId: number;
  className?: string;
}) {
  const { has } = useWishlist();
  const saved = has(productId);

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      onClick={() => toast(toggleWishlist(productId) ? "Saved to your wishlist" : "Removed from your wishlist")}
      className={cn(
        "grid place-items-center rounded-full bg-white/90 text-ink shadow-sm transition-colors hover:text-mauve",
        "size-10",
        className
      )}
    >
      <Heart className={cn("size-5", saved && "fill-mauve text-mauve")} />
    </button>
  );
}
