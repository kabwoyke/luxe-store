import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { formatKES } from "@/lib/format";
import { getOrderFor } from "@/lib/orders";
import { getPaymentStatus, msSince } from "@/lib/payments";
import { requireUser } from "@/lib/session";
import { OrderItems, StatusBadge, formatOrderDate } from "@/components/orders/order-parts";
import { PaymentPanel, type PaymentView } from "@/components/orders/payment-panel";
import { PageContainer } from "@/components/shop/page-header";

export const metadata: Metadata = { title: "Order | LUXESTORE" };

export default function OrderPage({ params }: PageProps<"/order/[id]">) {
  return (
    <PageContainer>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-blush" />}>
        <Order params={params} />
      </Suspense>
    </PageContainer>
  );
}

async function Order({ params }: Pick<PageProps<"/order/[id]">, "params">) {
  const { id } = await params;
  const orderId = Number(id);
  const user = await requireUser(`/order/${id}`);
  if (!Number.isInteger(orderId) || orderId <= 0) notFound();

  // Only the owner (or an admin) gets the order; anyone else sees a 404.
  const order = await getOrderFor(orderId, user);
  if (!order) notFound();

  const subtotal = order.total - order.deliveryFee;

  // Only the buyer pays; an admin looking at someone else's order just sees the status.
  const status = order.userId === user.id ? await getPaymentStatus(order.id) : null;
  const initial: PaymentView | null = status && {
    ...status,
    payment: status.payment && { ...status.payment, createdAt: status.payment.createdAt.toISOString() },
  };
  const elapsedMs = status?.payment ? msSince(status.payment.createdAt) : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="micro-label text-mauve">Order</p>
          <h1 className="text-3xl font-bold tracking-tight">#{order.id}</h1>
          <p className="text-sm text-muted-ink">Placed {formatOrderDate(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="flex items-center gap-1.5">
            Order <StatusBadge status={order.status} />
          </span>
          <span className="flex items-center gap-1.5">
            Payment <StatusBadge status={order.paymentStatus} />
          </span>
        </div>
      </div>

      {initial && (
        <PaymentPanel
          orderId={order.id}
          total={order.total}
          defaultPhone={order.deliveryPhone}
          initial={initial}
          elapsedMs={elapsedMs}
        />
      )}

      <section className="rounded-3xl border border-border bg-white p-5" aria-label="Items">
        <OrderItems items={order.items} />
        <dl className="mt-3 space-y-1.5 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-body">Subtotal</dt>
            <dd className="font-medium text-ink">{formatKES(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-body">Delivery</dt>
            <dd className="font-medium text-ink">{order.deliveryFee === 0 ? "Free" : formatKES(order.deliveryFee)}</dd>
          </div>
          <div className="flex justify-between text-base">
            <dt className="font-semibold text-ink">Total</dt>
            <dd className="font-bold text-mauve">{formatKES(order.total)}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-3xl border border-border bg-white p-5" aria-label="Delivery details">
        <h2 className="mb-3 text-lg font-bold">Delivery</h2>
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[8rem_1fr]">
          <dt className="text-muted-ink">Name</dt>
          <dd className="text-ink">{order.deliveryName}</dd>
          <dt className="text-muted-ink">Phone</dt>
          <dd className="text-ink">{order.deliveryPhone}</dd>
          {order.deliveryCounty && (
            <>
              <dt className="text-muted-ink">County / town</dt>
              <dd className="text-ink">{order.deliveryCounty}</dd>
            </>
          )}
          <dt className="text-muted-ink">Address</dt>
          <dd className="whitespace-pre-line text-ink">{order.deliveryAddress}</dd>
          {order.deliveryNotes && (
            <>
              <dt className="text-muted-ink">Notes</dt>
              <dd className="whitespace-pre-line text-ink">{order.deliveryNotes}</dd>
            </>
          )}
        </dl>
      </section>
    </div>
  );
}
