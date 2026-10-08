"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Download, Loader2, Smartphone, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { describePaymentFailure } from "@/lib/mpesa/messages";
import { formatKES } from "@/lib/format";
import { cn } from "@/lib/utils";

export type PaymentView = {
  orderStatus: string;
  paymentStatus: string;
  payment: null | {
    id: number;
    status: string;
    phone: string;
    resultCode: number | null;
    resultDesc: string | null;
    mpesaReceipt: string | null;
    createdAt: string;
  };
};

const POLL_EVERY_MS = 3000;
const POLL_FOR_MS = 90_000;
const input =
  "w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-ink focus:border-mauve focus:outline-none";

/** Triggers the browser's download of the receipt, once per order on this device. */
function downloadReceiptOnce(orderId: number) {
  const key = `luxe-receipt-downloaded-${orderId}`;
  try {
    if (window.localStorage.getItem(key)) return;
    window.localStorage.setItem(key, "1");
  } catch {
    // Storage blocked: fall through and download anyway.
  }
  const link = document.createElement("a");
  link.href = `/api/orders/${orderId}/receipt`;
  link.download = `LUXESTORE-receipt-order-${orderId}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function PaymentPanel({
  orderId,
  total,
  defaultPhone,
  initial,
  elapsedMs,
}: {
  orderId: number;
  total: number;
  defaultPhone: string;
  initial: PaymentView;
  /** How long the latest prompt had already been pending when the page was rendered. */
  elapsedMs: number;
}) {
  const router = useRouter();
  const [view, setView] = useState<PaymentView>(initial);
  const [phone, setPhone] = useState(initial.payment?.phone ?? defaultPhone);
  const [changingNumber, setChangingNumber] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(elapsedMs >= POLL_FOR_MS);
  const wasPaid = useRef(initial.paymentStatus === "paid");

  const waiting = view.payment?.status === "pending" && view.paymentStatus === "pending";
  const paid = view.paymentStatus === "paid";
  const needsReview = paid && view.orderStatus === "pending";
  const closed = view.orderStatus === "cancelled";

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}/payment`, { cache: "no-store" });
      if (res.ok) setView(await res.json());
    } catch {
      // Network blip: the next poll will try again.
    }
  }, [orderId]);

  // Poll every 3s for up to 90s while a prompt is waiting (the server also asks Daraja if the callback is late).
  useEffect(() => {
    if (!waiting || timedOut) return;
    const startedAt = Date.now();
    const id = window.setInterval(() => {
      if (elapsedMs + (Date.now() - startedAt) >= POLL_FOR_MS) {
        setTimedOut(true);
        return;
      }
      void refresh();
    }, POLL_EVERY_MS);
    return () => window.clearInterval(id);
  }, [waiting, timedOut, elapsedMs, refresh]);

  // The moment the payment lands: confirm, download the receipt, and refresh the server-rendered parts.
  useEffect(() => {
    if (paid && !wasPaid.current) {
      wasPaid.current = true;
      toast.success("Payment received. Thank you!");
      if (!needsReview) downloadReceiptOnce(orderId);
      router.refresh();
    }
  }, [paid, needsReview, orderId, router]);

  async function sendPrompt(number: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/mpesa/stkpush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, phone: number }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "We could not send the M-Pesa prompt.");
        return;
      }
      setChangingNumber(false);
      setTimedOut(false);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  /* ---------- states ---------- */

  if (closed) {
    return <Panel tone="muted" icon={<TriangleAlert className="size-5" />} title="This order was cancelled" />;
  }

  if (paid && !needsReview) {
    return (
      <Panel tone="success" icon={<CheckCircle2 className="size-5" />} title="Payment received">
        <p className="text-sm text-body">
          Thank you! We have received {formatKES(total)}
          {view.payment?.mpesaReceipt ? ` (M-Pesa receipt ${view.payment.mpesaReceipt})` : ""}. Your receipt downloads
          automatically.
        </p>
        <a
          href={`/api/orders/${orderId}/receipt`}
          download
          className="mt-3 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-white hover:bg-ink-hover"
        >
          <Download className="size-4" /> Download receipt
        </a>
      </Panel>
    );
  }

  if (needsReview) {
    return (
      <Panel tone="warn" icon={<TriangleAlert className="size-5" />} title="Payment received, checking your items">
        <p className="text-sm text-body">
          We received your payment, but one of the items sold out at the same moment. Our team will contact you shortly
          to arrange a replacement or a full refund. Nothing more is needed from you.
        </p>
      </Panel>
    );
  }

  if (waiting) {
    return (
      <Panel tone="info" icon={<Loader2 className={cn("size-5", !timedOut && "animate-spin")} />} title={timedOut ? "Still waiting for M-Pesa" : "Check your phone"}>
        <p className="text-sm text-body" aria-live="polite">
          {timedOut
            ? `We have not heard back from M-Pesa yet for ${view.payment?.phone}. If you completed the payment, it can take a minute to show up.`
            : `Enter your M-Pesa PIN on ${view.payment?.phone} to pay ${formatKES(total)}. This page updates by itself.`}
        </p>
        {timedOut && (
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={refresh} className={secondary}>
              Check payment status
            </button>
            <button type="button" disabled={busy} onClick={() => sendPrompt(view.payment!.phone)} className={primary}>
              Resend prompt
            </button>
            <button type="button" onClick={() => setChangingNumber(true)} className={secondary}>
              Pay with a different number
            </button>
          </div>
        )}
        {changingNumber && <NumberForm phone={phone} setPhone={setPhone} busy={busy} onSubmit={sendPrompt} error={error} />}
        {!changingNumber && error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
      </Panel>
    );
  }

  // No payment yet, or the last attempt failed or was cancelled.
  const failed = view.payment && (view.payment.status === "failed" || view.payment.status === "cancelled");
  return (
    <Panel
      tone={failed ? "warn" : "info"}
      icon={failed ? <TriangleAlert className="size-5" /> : <Smartphone className="size-5" />}
      title={failed ? "Payment not completed" : `Pay ${formatKES(total)} with M-Pesa`}
    >
      {failed && (
        <p className="mb-3 text-sm text-body" role="status">
          {describePaymentFailure(view.payment!.resultCode, view.payment!.resultDesc)} Your order is saved, so you can try again.
        </p>
      )}
      {failed && !changingNumber ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => sendPrompt(view.payment!.phone)} className={primary}>
            {busy ? "Sending…" : "Resend prompt"}
          </button>
          <button type="button" onClick={() => setChangingNumber(true)} className={secondary}>
            Pay with a different number
          </button>
        </div>
      ) : (
        <NumberForm phone={phone} setPhone={setPhone} busy={busy} onSubmit={sendPrompt} error={error} label={failed ? "Send to a different number" : "Pay with M-Pesa"} />
      )}
      {failed && !changingNumber && error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    </Panel>
  );
}

const primary =
  "h-11 rounded-full bg-ink px-6 text-sm font-semibold text-white transition-colors hover:bg-ink-hover disabled:opacity-60";
const secondary =
  "h-11 rounded-full border border-border bg-white px-6 text-sm font-semibold text-ink transition-colors hover:border-mauve hover:text-mauve";

function NumberForm({
  phone,
  setPhone,
  busy,
  onSubmit,
  error,
  label = "Send prompt",
}: {
  phone: string;
  setPhone: (value: string) => void;
  busy: boolean;
  onSubmit: (phone: string) => void;
  error: string | null;
  label?: string;
}) {
  return (
    <form
      className="mt-3 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(phone);
      }}
    >
      <div>
        <label htmlFor="pay-phone" className="mb-1 block text-sm text-body">
          M-Pesa number
        </label>
        <input
          id="pay-phone"
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0712 345 678"
          className={input}
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy || phone.trim() === ""} className="h-12 w-full rounded-full bg-linear-to-r from-pink-600 to-purple-700 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 sm:w-auto sm:px-8">
        {busy ? "Sending…" : label}
      </button>
    </form>
  );
}

const TONES = {
  info: "border-border bg-white",
  success: "border-emerald-200 bg-emerald-50",
  warn: "border-amber-200 bg-amber-50",
  muted: "border-border bg-zinc-50",
} as const;

function Panel({
  tone,
  icon,
  title,
  children,
}: {
  tone: keyof typeof TONES;
  icon: React.ReactNode;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-3xl border p-5", TONES[tone])} aria-label="Payment">
      <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-ink">
        {icon} {title}
      </h2>
      {children}
    </section>
  );
}
