"use client";

import { createContext, useContext, useState } from "react";
import dynamic from "next/dynamic";

// The drawer's code (dialog, icons, cart list) is fetched the first time the cart is opened.
const CartDrawer = dynamic(() => import("./cart-drawer"), { ssr: false });

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
  const [everOpened, setEverOpened] = useState(false);

  function change(next: boolean) {
    if (next) setEverOpened(true);
    setOpen(next);
  }

  return (
    <Ctx.Provider value={{ open, setOpen: change }}>
      {children}
      {everOpened && <CartDrawer open={open} onOpenChange={change} freeDeliveryThreshold={freeDeliveryThreshold} />}
    </Ctx.Provider>
  );
}
