"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Status = "idle" | "sending" | "done" | "error";

export function NewsletterForm({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = new FormData(form).get("email");
    setStatus("sending");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      form.reset();
      setStatus("done");
      setMessage("Thank you, you're on the list.");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  const dark = tone === "dark";

  return (
    <div>
      <form onSubmit={onSubmit} className="flex gap-2">
        <label htmlFor={`newsletter-email-${tone}`} className="sr-only">
          Email address
        </label>
        <input
          id={`newsletter-email-${tone}`}
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className={cn(
            "h-11 min-w-0 flex-1 rounded-full border px-4 text-sm focus:outline-none",
            dark
              ? "border-white/20 bg-white/10 text-white placeholder:text-white/40 focus:border-pink-300"
              : "border-border bg-white text-ink placeholder:text-muted-ink focus:border-mauve"
          )}
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="h-11 shrink-0 rounded-full bg-linear-to-r from-pink-600 to-purple-700 px-5 text-sm font-semibold text-white disabled:opacity-60"
        >
          Join
        </button>
      </form>
      {message && (
        <p
          role="status"
          className={cn("mt-2 text-xs", status === "error" ? "text-red-400" : dark ? "text-pink-200" : "text-mauve")}
        >
          {message}
        </p>
      )}
    </div>
  );
}
