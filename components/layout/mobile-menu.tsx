"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Menu } from "lucide-react";

const loadSheet = () => import("./mobile-menu-sheet");
const MobileMenuSheet = dynamic(loadSheet, { ssr: false });

/** Hamburger button. The menu itself is fetched once the page is idle, or on first touch, whichever comes first. */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 3000));
    const id = idle(() => void loadSheet());
    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(id as number);
    };
  }, []);

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        aria-haspopup="dialog"
        onPointerEnter={() => void loadSheet()}
        onFocus={() => void loadSheet()}
        onClick={() => {
          setMounted(true);
          setOpen(true);
        }}
        className="grid size-10 place-items-center rounded-full text-ink hover:bg-blush xl:hidden"
      >
        <Menu className="size-5" />
      </button>
      {mounted && <MobileMenuSheet open={open} onOpenChange={setOpen} />}
    </>
  );
}
