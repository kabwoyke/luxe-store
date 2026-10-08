import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center sm:py-28">
      <p className="micro-label text-mauve">Error 404</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">We could not find that page</h1>
      <p className="mt-4 text-body">
        The link may be old, or the product may have sold out and been removed. Try the shop, or search for what you
        are looking for.
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/shop" className="inline-flex h-12 items-center justify-center rounded-full bg-ink px-8 text-sm font-semibold text-white hover:bg-ink-hover">
          Browse the shop
        </Link>
        <Link href="/" className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-white px-8 text-sm font-semibold text-ink hover:border-mauve hover:text-mauve">
          Back to home
        </Link>
      </div>
      <form action="/search" role="search" className="mx-auto mt-8 flex max-w-sm gap-2">
        <label htmlFor="nf-search" className="sr-only">
          Search products
        </label>
        <input id="nf-search" name="q" type="search" placeholder="Search wigs, shoes, bags…" className="h-11 min-w-0 flex-1 rounded-full border border-border bg-white px-4 text-sm focus:border-mauve focus:outline-none" />
        <button type="submit" className="h-11 rounded-full bg-mauve px-5 text-sm font-semibold text-white hover:bg-mauve-dark">
          Search
        </button>
      </form>
    </div>
  );
}
