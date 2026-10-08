"use client";

import { useEffect } from "react";
import Link from "next/link";

/** Shown when something breaks while a page is rendering. The rest of the site keeps working. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center sm:py-28" role="alert">
      <p className="micro-label text-mauve">Something went wrong</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">That did not work</h1>
      <p className="mt-4 text-body">
        We hit a problem loading this page. It is on our side, not yours. Please try again, and if it keeps happening,
        let us know.
      </p>
      {error.digest && <p className="mt-2 text-xs text-muted-ink">Reference: {error.digest}</p>}
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <button type="button" onClick={reset} className="inline-flex h-12 items-center justify-center rounded-full bg-ink px-8 text-sm font-semibold text-white hover:bg-ink-hover">
          Try again
        </button>
        <Link href="/" className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-white px-8 text-sm font-semibold text-ink hover:border-mauve hover:text-mauve">
          Back to home
        </Link>
        <Link href="/contact" className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-white px-8 text-sm font-semibold text-ink hover:border-mauve hover:text-mauve">
          Contact us
        </Link>
      </div>
    </div>
  );
}
