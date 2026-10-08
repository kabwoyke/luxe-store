"use client";

import { createContext, useContext, useState } from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { removeFromCart, setCartQty, useCart } from "@/lib/cart";
import { formatKES } from "@/lib/format";
import { kesLabel } from "@/lib/pricing";
import { ProductImage } from "@/components/shop/product-image";

type CartDrawerContext = { open: boolean; setOpen: (open: boolean) => void };

const Ctx = createContext<CartDrawerContext | null>(null);

export function useCartDrawer() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useCartDrawer must be used inside CartDrawerProvider");
  }
  return ctx;
}

export function CartDrawerProvider({
  children,
  freeDeliveryThreshold,
}: {
  children: React.ReactNode;
  freeDeliveryThreshold: number;
}) {
  const [open, setOpen] = useState(false);
  const { items, subtotal, count } = useCart();

  return (
    <Ctx.Provider value={{ open, setOpen }}>
      {children}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-[calc(100vw-1.5rem)] bg-page sm:max-w-md"
        >
          <SheetHeader className="border-b border-border p-5">
            <SheetTitle className="text-xl">Your cart ({count})</SheetTitle>
            <SheetDescription>Free delivery across Kenya over {kesLabel(freeDeliveryThreshold)}.</SheetDescription>
          </SheetHeader>

          {items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
              <span className="grid size-14 place-items-center rounded-full bg-blush text-mauve">
                <ShoppingBag className="size-6" />
              </span>
              <p className="text-sm text-muted-ink">Your cart is empty.</p>
              <Link
                href="/shop"
                onClick={() => setOpen(false)}
                className="text-sm font-semibold text-mauve hover:text-mauve-dark"
              >
                Continue shopping
              </Link>
            </div>
          ) : (
            <>
              <ul className="flex-1 divide-y divide-border overflow-y-auto px-5">
                {items.map((item) => (
                  <li key={item.key} className="flex gap-3 py-4">
                    <Link
                      href={`/products/${item.productId}`}
                      onClick={() => setOpen(false)}
                      className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-blush"
                    >
                      <ProductImage src={item.image} alt={item.name} sizes="80px" className="object-cover" />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <Link
                        href={`/products/${item.productId}`}
                        onClick={() => setOpen(false)}
                        className="line-clamp-2 text-sm font-semibold leading-snug text-ink hover:text-mauve"
                      >
                        {item.name}
                      </Link>
                      {item.label && <p className="text-xs text-muted-ink">{item.label}</p>}
                      <p className="text-sm font-bold text-mauve">{formatKES(item.price)}</p>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center rounded-full border border-border bg-white">
                          <button
                            type="button"
                            aria-label={`Decrease quantity of ${item.name}`}
                            disabled={item.qty <= 1}
                            onClick={() => setCartQty(item.key, item.qty - 1)}
                            className="grid size-10 place-items-center rounded-full text-ink disabled:opacity-40"
                          >
                            <Minus className="size-4" />
                          </button>
                          <span className="min-w-6 text-center text-sm font-semibold" aria-live="polite">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            aria-label={`Increase quantity of ${item.name}`}
                            disabled={item.qty >= item.maxQty}
                            onClick={() => setCartQty(item.key, item.qty + 1)}
                            className="grid size-10 place-items-center rounded-full text-ink disabled:opacity-40"
                          >
                            <Plus className="size-4" />
                          </button>
                        </div>
                        <button
                          type="button"
                          aria-label={`Remove ${item.name}`}
                          onClick={() => removeFromCart(item.key)}
                          className="grid size-10 place-items-center rounded-full text-muted-ink hover:bg-blush hover:text-mauve"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      {item.qty >= item.maxQty && (
                        <p className="text-xs text-warn">That is all we have in this option.</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <div className="space-y-3 border-t border-border p-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-body">Subtotal</span>
                  <span className="text-lg font-bold text-ink">{formatKES(subtotal)}</span>
                </div>
                <p className="text-xs text-muted-ink">Delivery is calculated at checkout.</p>
                <Link
                  href="/checkout"
                  onClick={() => setOpen(false)}
                  className="flex h-12 w-full items-center justify-center rounded-full bg-ink text-sm font-semibold text-white transition-colors hover:bg-ink-hover"
                >
                  Checkout
                </Link>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </Ctx.Provider>
  );
}
