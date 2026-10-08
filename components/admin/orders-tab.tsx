"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, type Serialized } from "@/lib/admin-api";
import type { AdminOrder } from "@/lib/admin-data";
import { formatKES } from "@/lib/format";
import { ORDER_STATUSES } from "@/lib/schemas/order";
import { cn } from "@/lib/utils";
import { StatusBadge, formatOrderDate } from "@/components/orders/order-parts";
import { ProductImage } from "@/components/shop/product-image";
import { ErrorNote, Loading, TableBox, td, th } from "./ui";

type Order = Serialized<AdminOrder>;

export function OrdersTab() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");

  const { data, error, isPending } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: () => api<{ orders: Order[] }>("/api/admin/orders"),
  });

  const update = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api(`/api/orders/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: (_d, vars) => {
      toast.success(`Order #${vars.id} is now ${vars.status}`);
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update the order."),
  });

  if (error) return <ErrorNote error={error} />;
  if (isPending) return <Loading label="Loading orders" />;

  const orders = filter === "all" ? data.orders : data.orders.filter((o) => o.status === filter);
  const count = (s: string) => data.orders.filter((o) => (s === "all" ? true : o.status === s)).length;

  return (
    <div className="space-y-4">
      <div className="no-scrollbar flex gap-2 overflow-x-auto" role="group" aria-label="Filter by status">
        {["all", ...ORDER_STATUSES].map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={filter === s}
            onClick={() => setFilter(s)}
            className={cn(
              "min-h-10 shrink-0 rounded-full border px-4 text-sm font-semibold capitalize transition-colors",
              filter === s ? "border-ink bg-ink text-white" : "border-border bg-white text-body hover:border-mauve hover:text-mauve"
            )}
          >
            {s} ({count(s)})
          </button>
        ))}
      </div>

      <TableBox>
        <table className="w-full min-w-4xl">
          <thead className="border-b border-border">
            <tr>
              <th className={th}>Order</th>
              <th className={th}>Customer</th>
              <th className={th}>Items</th>
              <th className={`${th} text-right`}>Total</th>
              <th className={th}>Payment</th>
              <th className={th}>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className={`${td} py-10 text-center`}>
                  No orders here yet.
                </td>
              </tr>
            )}
            {orders.map((o) => {
              const needsReview = o.paymentStatus === "paid" && o.status === "pending";
              return (
                <tr key={o.id} className={needsReview ? "bg-amber-50" : undefined}>
                  <td className={td}>
                    <Link href={`/order/${o.id}`} className="font-semibold text-ink hover:text-mauve">
                      #{o.id}
                    </Link>
                    <p className="whitespace-nowrap text-xs text-muted-ink">{formatOrderDate(new Date(o.createdAt))}</p>
                  </td>
                  <td className={td}>
                    <p className="font-medium text-ink">{o.customerName}</p>
                    <p className="text-xs text-muted-ink">{o.deliveryPhone}</p>
                    <p className="max-w-56 text-xs text-muted-ink">
                      {[o.deliveryCounty, o.deliveryAddress].filter(Boolean).join(", ")}
                    </p>
                  </td>
                  <td className={td}>
                    <ul className="space-y-1.5">
                      {o.items.map((i) => (
                        <li key={i.id} className="flex items-center gap-2">
                          <span className="relative size-9 shrink-0 overflow-hidden rounded-lg bg-blush">
                            {i.imageUrl && <ProductImage src={i.imageUrl} alt="" sizes="36px" className="object-cover" />}
                          </span>
                          <span>
                            {i.quantity} × {i.productName}
                            {i.variantLabel && <span className="text-muted-ink"> ({i.variantLabel})</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className={`${td} whitespace-nowrap text-right font-semibold text-ink`}>{formatKES(o.total)}</td>
                  <td className={td}>
                    <StatusBadge status={o.paymentStatus} />
                    {needsReview && <p className="mt-1 max-w-40 text-xs font-semibold text-amber-800">Needs review: paid, item sold out</p>}
                  </td>
                  <td className={td}>
                    <label className="sr-only" htmlFor={`status-${o.id}`}>
                      Status of order {o.id}
                    </label>
                    <select
                      id={`status-${o.id}`}
                      value={o.status}
                      disabled={update.isPending && update.variables?.id === o.id}
                      onChange={(e) => update.mutate({ id: o.id, status: e.target.value })}
                      className="h-10 rounded-full border border-border bg-white px-3 text-sm capitalize text-ink focus:border-mauve focus:outline-none"
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableBox>
    </div>
  );
}
