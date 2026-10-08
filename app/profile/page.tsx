import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { logout } from "@/app/actions/auth";
import { formatKES } from "@/lib/format";
import { listOrdersForUser } from "@/lib/orders";
import { requireUser } from "@/lib/session";
import { OrderItems, StatusBadge, formatOrderDate } from "@/components/orders/order-parts";
import { PageContainer, PageHeader } from "@/components/shop/page-header";

export const metadata: Metadata = { title: "My account", robots: { index: false, follow: false } };

export default function ProfilePage() {
  return (
    <PageContainer>
      <PageHeader eyebrow="My account" title="Hello" />
      <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-blush" />}>
        <Profile />
      </Suspense>
    </PageContainer>
  );
}

async function Profile() {
  const user = await requireUser("/profile");
  const orders = await listOrdersForUser(user.id);

  return (
    <div className="grid gap-8 lg:grid-cols-[20rem_1fr]">
      <aside className="h-fit space-y-4 rounded-3xl border border-border bg-white p-6">
        <div>
          <p className="font-heading text-xl font-bold text-ink">
            {user.firstName} {user.lastName}
          </p>
          <p className="break-all text-sm text-body">{user.email}</p>
          {user.isAdmin && (
            <Link href="/admin" className="mt-2 inline-block text-sm font-semibold text-mauve hover:text-mauve-dark">
              Open admin
            </Link>
          )}
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="h-11 w-full rounded-full border border-border text-sm font-semibold text-ink transition-colors hover:border-mauve hover:text-mauve"
          >
            Log out
          </button>
        </form>
      </aside>

      <section aria-labelledby="orders-heading" className="min-w-0">
        <h2 id="orders-heading" className="mb-4 text-2xl font-bold">
          Order history
        </h2>
        {orders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-white px-6 py-14 text-center">
            <p className="font-heading text-lg font-semibold text-ink">No orders yet</p>
            <Link
              href="/shop"
              className="mt-4 inline-flex h-11 items-center rounded-full bg-ink px-6 text-sm font-semibold text-white hover:bg-ink-hover"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {orders.map((order) => (
              <li key={order.id} className="rounded-3xl border border-border bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <Link href={`/order/${order.id}`} className="font-heading text-lg font-bold text-ink hover:text-mauve">
                      Order #{order.id}
                    </Link>
                    <p className="text-xs text-muted-ink">{formatOrderDate(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={order.status} />
                    <span className="font-bold text-mauve">{formatKES(order.total)}</span>
                  </div>
                </div>
                <OrderItems items={order.items} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
