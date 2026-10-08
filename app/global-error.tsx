"use client";

/** Last resort: the whole layout failed, so this brings its own html and body. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#fffafc", color: "#2d1a2d" }}>
        <main style={{ maxWidth: 520, margin: "0 auto", padding: "96px 24px", textAlign: "center" }}>
          <h1 style={{ fontSize: 32, margin: "0 0 12px" }}>Something went wrong</h1>
          <p style={{ color: "#5d4c56", lineHeight: 1.6 }}>
            LUXESTORE hit an unexpected problem. Please try again in a moment.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: 24, height: 48, padding: "0 32px", borderRadius: 999, border: 0, background: "#2d1a2d", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
