"use client";

import Link from "next/link";
import { Heart, ShoppingBag, User } from "lucide-react";
import { useCartDrawer } from "@/components/cart/cart-drawer-provider";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";

const iconBtn =
  "relative size-10 place-items-center rounded-full text-ink transition-colors hover:bg-blush";

function Badge({ n }: { n: number }) {
  if (n <= 0) return null;
  return (
    <span className="absolute -right-0.5 -top-0.5 grid min-w-[18px] place-items-center rounded-full bg-mauve px-1 text-[10px] font-bold leading-[18px] text-white">
      {n > 99 ? "99+" : n}
    </span>
  );
}

export function HeaderActions() {
  const { setOpen } = useCartDrawer();
  const { count } = useCart();
  const { ids } = useWishlist();

  return (
    <>
      <Link
        href="/wishlist"
        aria-label={`Wishlist (${ids.length})`}
        className={`${iconBtn} hidden xl:grid`}
      >
        <Heart className="size-5" />
        <Badge n={ids.length} />
      </Link>
      <button
        type="button"
        aria-label={`Open cart (${count} items)`}
        onClick={() => setOpen(true)}
        className={`${iconBtn} grid`}
      >
        <ShoppingBag className="size-5" />
        <Badge n={count} />
      </button>
      <Link
        href="/profile"
        aria-label="Account"
        className={`${iconBtn} hidden xl:grid`}
      >
        <User className="size-5" />
      </Link>
    </>
  );
}
