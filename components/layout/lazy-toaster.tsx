"use client";

import dynamic from "next/dynamic";

// Toasts are only needed after something happens, so the library is not part of the first load.
const Toaster = dynamic(() => import("sonner").then((m) => m.Toaster), { ssr: false });

export function LazyToaster() {
  return <Toaster position="top-center" />;
}
