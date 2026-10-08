"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Download, TriangleAlert } from "lucide-react";
import { api, type Serialized } from "@/lib/admin-api";
import type { Analytics } from "@/lib/admin-data";
import { formatKES } from "@/lib/format";
import { CATEGORIES } from "@/lib/product-options";
import { StatusBadge, formatOrderDate } from "@/components/orders/order-parts";
import { ErrorNote, Loading, StatCard, TableBox, td, th } from "./ui";

type Data = Serialized<Analytics>;

export function OverviewTab() {
  const { data, error, isPending } = useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: () => api<Data>("/api/admin/analytics"),
  });

  if (error) return <ErrorNote error={error} />;
  if (isPending) return <Loading label="Loading overview" />;

  const pending = data.orderCounts.pending ?? 0;

  return (
    <div className="space-y-8">
      {data.needsReview > 0 && (
        <div role="alert" className="flex items-start gap-3 rounded-3xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <TriangleAlert className="mt-0.5 size-5 shrink-0" />
          <p>
            <strong>
              {data.needsReview} paid {data.needsReview === 1 ? "order needs" : "orders need"} review.
            </strong>{" "}
            The customer paid but an item sold out at the same moment. Refund them or restock, then update the order.{" "}
            <Link href="/admin/orders" className="font-semibold underline">
              Open orders
            </Link>
          </p>
        </div>
      )}

      <section aria-label="Key numbers" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Revenue" value={formatKES(data.revenue)} hint={`${data.paidOrders} paid ${data.paidOrders === 1 ? "order" : "orders"}`} />
        <StatCard label="Orders waiting" value={String(pending)} hint="Placed, not yet shipped" />
        <StatCard label="Customers" value={String(data.customers)} />
        <StatCard label="Products" value={String(data.productCount)} hint={data.outOfStockProducts > 0 ? `${data.outOfStockProducts} out of stock` : "All in stock"} tone={data.outOfStockProducts > 0 ? "warn" : "default"} />
        <StatCard label="Units in stock" value={data.unitsInStock.toLocaleString("en-KE")} />
        <StatCard label="Stock value" value={formatKES(data.inventoryValue)} hint="At selling price" />
        <StatCard label="Shipped" value={String(data.orderCounts.shipped ?? 0)} />
        <StatCard label="Delivered" value={String(data.orderCounts.delivered ?? 0)} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <SalesByCategory rows={data.salesByCategory} />

        <section aria-labelledby="low-stock" className="rounded-3xl border border-border bg-white p-5">
          <h2 id="low-stock" className="text-lg font-bold">
            Low stock
          </h2>
          <p className="mb-3 text-xs text-muted-ink">Options with {data.lowStockThreshold} or fewer left. Change this in Settings.</p>
          {data.lowStock.length === 0 ? (
            <p className="text-sm text-body">Nothing is running low.</p>
          ) : (
            <ul className="max-h-72 divide-y divide-border overflow-y-auto">
              {data.lowStock.map((item, i) => (
                <li key={`${item.productId}-${item.label}-${i}`} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="min-w-0">
                    <span className="font-medium text-ink">{item.name}</span>
                    {item.label && <span className="text-muted-ink"> · {item.label}</span>}
                  </span>
                  <span className={item.stock === 0 ? "shrink-0 font-semibold text-destructive" : "shrink-0 font-semibold text-warn"}>
                    {item.stock === 0 ? "Sold out" : `${item.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section aria-labelledby="recent-orders">
        <h2 id="recent-orders" className="mb-3 text-lg font-bold">
          Recent orders
        </h2>
        <TableBox>
          <table className="w-full min-w-[34rem]">
            <thead className="border-b border-border">
              <tr>
                <th className={th}>Order</th>
                <th className={th}>Customer</th>
                <th className={th}>Placed</th>
                <th className={th}>Payment</th>
                <th className={th}>Status</th>
                <th className={`${th} text-right`}>Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.recentOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className={`${td} text-center`}>
                    No orders yet.
                  </td>
                </tr>
              )}
              {data.recentOrders.map((o) => (
                <tr key={o.id}>
                  <td className={`${td} font-semibold text-ink`}>#{o.id}</td>
                  <td className={td}>{o.customer}</td>
                  <td className={`${td} whitespace-nowrap`}>{formatOrderDate(new Date(o.createdAt))}</td>
                  <td className={td}>
                    <StatusBadge status={o.paymentStatus} />
                  </td>
                  <td className={td}>
                    <StatusBadge status={o.status} />
                  </td>
                  <td className={`${td} text-right font-semibold text-ink`}>{formatKES(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableBox>
      </section>

      <section aria-labelledby="exports" className="rounded-3xl border border-border bg-white p-5">
        <h2 id="exports" className="text-lg font-bold">
          Export to CSV
        </h2>
        <p className="mb-3 text-xs text-muted-ink">Opens in Excel or Google Sheets.</p>
        <div className="flex flex-wrap gap-2">
          {(["orders", "products", "customers"] as const).map((type) => (
            <a
              key={type}
              href={`/api/admin/export?type=${type}`}
              download={`luxestore-${type}.csv`}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-white px-5 text-sm font-semibold capitalize text-ink transition-colors hover:border-mauve hover:text-mauve"
            >
              <Download className="size-4" /> {type}
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

/**
 * Revenue by category from paid orders. One series, one hue, bars anchored at the baseline with
 * a rounded data end, direct value labels, and a table view for anyone who prefers numbers.
 */
function SalesByCategory({ rows }: { rows: Data["salesByCategory"] }) {
  const max = Math.max(1, ...rows.map((r) => r.revenue));
  const label = (key: string) => CATEGORIES[key]?.label ?? key;

  return (
    <section aria-labelledby="sales-by-category" className="rounded-3xl border border-border bg-white p-5">
      <h2 id="sales-by-category" className="text-lg font-bold">
        Revenue by category
      </h2>
      <p className="mb-4 text-xs text-muted-ink">Paid orders only, in KES.</p>

      {rows.length === 0 ? (
        <p className="text-sm text-body">Sales will show up here once an order is paid.</p>
      ) : (
        <>
          <ul className="space-y-3" aria-hidden>
            {rows.map((r) => (
              <li key={r.category} title={`${label(r.category)}: ${formatKES(r.revenue)} from ${r.units} ${r.units === 1 ? "unit" : "units"}`}>
                <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium text-ink">{label(r.category)}</span>
                  <span className="font-semibold text-ink">{formatKES(r.revenue)}</span>
                </div>
                <div className="h-2.5 rounded-full bg-blush">
                  <div className="h-full rounded-r-full rounded-l-sm bg-mauve" style={{ width: `${Math.max(2, (r.revenue / max) * 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer font-semibold text-mauve">View as table</summary>
            <table className="mt-2 w-full">
              <thead>
                <tr>
                  <th className={th}>Category</th>
                  <th className={`${th} text-right`}>Units</th>
                  <th className={`${th} text-right`}>Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.category}>
                    <td className={td}>{label(r.category)}</td>
                    <td className={`${td} text-right`}>{r.units}</td>
                    <td className={`${td} text-right`}>{formatKES(r.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </section>
  );
}
