"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShoppingBag, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { clearCart, useCart } from "@/lib/cart";
import { formatKES } from "@/lib/format";
import { KENYA_COUNTIES } from "@/lib/kenya-counties";
import { deliveryFeeFor } from "@/lib/pricing";
import type { Settings } from "@/lib/schemas/settings";
import {
  checkoutFormSchema,
  type CheckoutFormData,
  type CheckoutFormInput,
} from "@/lib/schemas/checkout";
import { ProductImage } from "@/components/shop/product-image";

const field =
  "w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-ink focus:border-mauve focus:outline-none";

function Field({
  label,
  id,
  error,
  hint,
  children,
}: {
  label: string;
  id: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm text-body">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-muted-ink">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function CheckoutForm({
  defaultName,
  defaultPhone,
  rules,
}: {
  defaultName: string;
  defaultPhone: string;
  rules: Pick<Settings, "deliveryFee" | "freeDeliveryThreshold">;
}) {
  const router = useRouter();
  const { items, subtotal } = useCart();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormInput, unknown, CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: { name: defaultName, phone: defaultPhone, county: "", address: "", notes: "", mpesaPhone: "" },
  });

  const deliveryFee = deliveryFeeFor(subtotal, rules);
  const total = subtotal + deliveryFee;

  async function onSubmit(values: CheckoutFormData) {
    setFormError(null);

    // 1. Create the order. The server re-reads prices and stock; only product, option and quantity are sent.
    const orderRes = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.qty })),
        delivery: {
          name: values.name,
          phone: values.phone,
          county: values.county,
          address: values.address,
          notes: values.notes,
        },
      }),
    });
    const order = await orderRes.json().catch(() => ({}));
    if (!orderRes.ok) {
      setFormError(
        orderRes.status === 401
          ? "Your session has expired. Please log in again."
          : (order.error ?? "We could not place your order.")
      );
      return;
    }
    clearCart();

    // 2. Ask M-Pesa to prompt the customer. If this fails the order is still saved and can be paid from its page.
    const payRes = await fetch("/api/mpesa/stkpush", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.orderId, phone: values.mpesaPhone ?? values.phone }),
    });
    if (!payRes.ok) {
      const body = await payRes.json().catch(() => ({}));
      toast.error(body.error ?? "We could not send the M-Pesa prompt.", {
        description: "Your order is saved. You can try again from the next page.",
      });
    }
    router.push(`/order/${order.orderId}`);
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-dashed border-border bg-white px-6 py-16 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-blush text-mauve">
          <ShoppingBag className="size-6" />
        </span>
        <p className="mt-4 font-heading text-lg font-semibold text-ink">Your cart is empty</p>
        <p className="mt-1 text-sm text-body">Add something you love, then come back to check out.</p>
        <Link
          href="/shop"
          className="mt-5 inline-flex h-11 items-center rounded-full bg-ink px-6 text-sm font-semibold text-white hover:bg-ink-hover"
        >
          Browse the shop
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-8 lg:grid-cols-[1fr_24rem]">
      <div className="space-y-6">
        <section className="space-y-4 rounded-3xl border border-border bg-white p-5 sm:p-6" aria-labelledby="delivery-heading">
          <h2 id="delivery-heading" className="text-xl font-bold">
            Delivery details
          </h2>
          <Field label="Full name" id="name" error={errors.name?.message}>
            <input id="name" autoComplete="name" className={field} {...register("name")} />
          </Field>
          <Field
            label="Phone number"
            id="phone"
            error={errors.phone?.message}
            hint="We call this number about your delivery."
          >
            <input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0712 345 678" className={field} {...register("phone")} />
          </Field>
          <Field label="County / town" id="county" error={errors.county?.message}>
            <input id="county" list="counties" autoComplete="address-level1" placeholder="e.g. Nairobi" className={field} {...register("county")} />
            <datalist id="counties">
              {KENYA_COUNTIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label="Delivery address" id="address" error={errors.address?.message}>
            <textarea id="address" rows={3} autoComplete="street-address" placeholder="Estate, street, building, landmark" className={field} {...register("address")} />
          </Field>
          <Field label="Order notes (optional)" id="notes" error={errors.notes?.message}>
            <textarea id="notes" rows={2} className={field} {...register("notes")} />
          </Field>
        </section>

        <section className="space-y-4 rounded-3xl border border-border bg-white p-5 sm:p-6" aria-labelledby="payment-heading">
          <h2 id="payment-heading" className="text-xl font-bold">
            Payment
          </h2>
          <div className="space-y-2" role="radiogroup" aria-label="Payment method">
            <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 border-mauve bg-blush/60 px-4">
              <input type="radio" name="method" defaultChecked className="size-4 accent-mauve" />
              <Smartphone className="size-5 text-mauve" />
              <span className="flex-1 text-sm font-semibold text-ink">M-Pesa</span>
              <span className="text-xs text-muted-ink">Pay with an STK prompt</span>
            </label>
            <label className="flex min-h-14 cursor-not-allowed items-center gap-3 rounded-2xl border border-border px-4 opacity-60">
              <input type="radio" name="method" disabled className="size-4" />
              <span className="flex-1 text-sm font-semibold text-ink">Card</span>
              <span className="rounded-full bg-blush px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-mauve-dark">
                Coming soon
              </span>
            </label>
          </div>
          <Field
            label="M-Pesa number"
            id="mpesaPhone"
            error={errors.mpesaPhone?.message}
            hint="Leave empty to pay with your phone number above, or enter a different Safaricom number."
          >
            <input id="mpesaPhone" type="tel" inputMode="tel" placeholder="Same as phone number above" className={field} {...register("mpesaPhone")} />
          </Field>
        </section>
      </div>

      <aside className="h-fit space-y-4 rounded-3xl border border-border bg-white p-5 shadow-[0_16px_40px_rgba(53,25,41,0.06)] sm:p-6 lg:sticky lg:top-36" aria-label="Order summary">
        <h2 className="text-xl font-bold">Order summary</h2>
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={item.key} className="flex gap-3 py-3">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-blush">
                <ProductImage src={item.image} alt={item.name} sizes="64px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-semibold text-ink">{item.name}</p>
                {item.label && <p className="text-xs text-muted-ink">{item.label}</p>}
                <p className="text-xs text-muted-ink">Qty {item.qty}</p>
              </div>
              <p className="shrink-0 text-sm font-bold text-ink">{formatKES(item.price * item.qty)}</p>
            </li>
          ))}
        </ul>
        <dl className="space-y-1.5 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-body">Subtotal</dt>
            <dd className="font-medium text-ink">{formatKES(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-body">Delivery</dt>
            <dd className="font-medium text-ink">{deliveryFee === 0 ? "Free" : formatKES(deliveryFee)}</dd>
          </div>
          {deliveryFee > 0 && (
            <p className="text-xs text-muted-ink">
              Add {formatKES(rules.freeDeliveryThreshold - subtotal)} more for free delivery (otherwise {formatKES(rules.deliveryFee)}).
            </p>
          )}
          <div className="flex justify-between border-t border-border pt-3 text-base">
            <dt className="font-semibold text-ink">Total</dt>
            <dd className="font-bold text-mauve">{formatKES(total)}</dd>
          </div>
        </dl>

        {formError && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-destructive">
            {formError}{" "}
            {/sold out|left of|no longer/i.test(formError) && (
              <span className="font-normal">Please update your cart and try again.</span>
            )}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-12 w-full rounded-full bg-linear-to-r from-pink-500 to-purple-600 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isSubmitting ? "Placing your order…" : `Pay ${formatKES(total)} with M-Pesa`}
        </button>
        <p className="text-center text-xs text-muted-ink">
          You will get a prompt on your phone to enter your M-Pesa PIN. The final price is confirmed by our server.
        </p>
      </aside>
    </form>
  );
}
