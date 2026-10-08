"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { contactSchema, type ContactInput } from "@/lib/schemas/contact";

const field =
  "w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-ink focus:border-mauve focus:outline-none";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({ resolver: zodResolver(contactSchema) });

  async function onSubmit(values: ContactInput) {
    setFormError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "We could not send your message. Please try again.");
      reset();
      setSent(true);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "We could not send your message. Please try again.");
    }
  }

  if (sent) {
    return (
      <div role="status" className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
        <p className="flex items-center gap-2 font-heading text-lg font-bold text-ink">
          <CheckCircle2 className="size-5 text-emerald-700" /> Message sent
        </p>
        <p className="mt-1 text-sm text-body">Thank you. We usually reply within one working day.</p>
        <button type="button" onClick={() => setSent(false)} className="mt-3 text-sm font-semibold text-mauve hover:text-mauve-dark">
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 rounded-3xl border border-border bg-white p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className="mb-1 block text-sm text-body">
            Your name
          </label>
          <input id="c-name" autoComplete="name" className={field} {...register("name")} />
          {errors.name && <p role="alert" className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="c-email" className="mb-1 block text-sm text-body">
            Email
          </label>
          <input id="c-email" type="email" autoComplete="email" className={field} {...register("email")} />
          {errors.email && <p role="alert" className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
        </div>
      </div>
      <div>
        <label htmlFor="c-phone" className="mb-1 block text-sm text-body">
          Phone (optional)
        </label>
        <input id="c-phone" type="tel" autoComplete="tel" className={field} {...register("phone")} />
      </div>
      <div>
        <label htmlFor="c-message" className="mb-1 block text-sm text-body">
          How can we help?
        </label>
        <textarea id="c-message" rows={5} className={field} {...register("message")} />
        {errors.message && <p role="alert" className="mt-1 text-xs text-destructive">{errors.message.message}</p>}
      </div>
      {/* Honeypot: people never see or fill this in. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="c-website">Leave this field empty</label>
        <input id="c-website" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>
      {formError && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-destructive">
          {formError}
        </p>
      )}
      <button type="submit" disabled={isSubmitting} className="h-12 rounded-full bg-ink px-8 text-sm font-semibold text-white transition-colors hover:bg-ink-hover disabled:opacity-60">
        {isSubmitting ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
