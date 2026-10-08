"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Menu, User } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NAV_LINKS } from "@/lib/nav";
import { SearchForm } from "./search-form";
import { Logo } from "./logo";

const rowLink =
  "flex min-h-11 items-center gap-3 text-sm font-medium text-body hover:text-mauve";

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Open menu"
        className="grid size-10 place-items-center rounded-full text-ink hover:bg-blush xl:hidden"
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[calc(100vw-3rem)] bg-page sm:max-w-sm"
      >
        <SheetHeader className="border-b border-border p-5">
          <SheetTitle>
            <Logo />
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5">
          <SearchForm id="mobile-search" />
          <nav aria-label="Main menu" className="flex flex-col">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={close}
                className={`${rowLink} border-b border-border`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col">
            <Link href="/wishlist" onClick={close} className={rowLink}>
              <Heart className="size-4" /> Wishlist
            </Link>
            <Link href="/profile" onClick={close} className={rowLink}>
              <User className="size-4" /> Account / Login
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
