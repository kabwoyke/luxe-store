"use client";

import { useState } from "react";
import Link from "next/link";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { api, type Serialized } from "@/lib/admin-api";
import type { AdminPayment } from "@/lib/admin-data";
import { formatKES } from "@/lib/format";
import { cn } from "@/lib/utils";
import { StatusBadge, formatOrderDate } from "@/components/orders/order-parts";
import { ErrorNote, Loading, TableBox, td, th } from "./ui";

type Payment = Serialized<AdminPayment>;

const FILTERS = ["all", "pending", "paid", "failed", "cancelled"] as const;
const actionButton =
  "min-h-10 whitespace-nowrap rounded-full border border-border bg-white px-4 text-xs font-semibold text-ink transition-colors hover:border-mauve hover:text-mauve disabled:opacity-50";

type Action = { id: number; action: "requery" } | { id: number; action: "mark-paid"; receipt: string };

export function PaymentsTab() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");

  const { data, error, isPending } = useQuery({
    queryKey: ["admin", "payments", filter, q],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);
      if (q) params.set("q", q);
      return api<{ payments: Payment[] }>(`/api/admin/payments?${params}`);
    },
    placeholderData: keepPreviousData,
  });

  const act = useMutation({
    mutationFn: ({ id, ...body }: Action) =>
      api<{ message: string }>(`/api/admin/payments/${id}`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (res) => {
      toast.success(res.message);
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update the payment."),
  });

  function markPaid(p: Payment) {
    const receipt = window.prompt(
      `Mark payment #${p.id} (order #${p.orderId}, ${formatKES(p.amount)}) as paid.\nOnly do this after confirming the money in your M-Pesa statement.\n\nM-Pesa receipt code:`
    );
    if (receipt?.trim()) act.mutate({ id: p.id, action: "mark-paid", receipt: receipt.trim() });
  }

  if (error) return <ErrorNote error={error} />;
  if (isPending) return <Loading label="Loading payments" />;

  const payments = data.payments;
  const busy = (id: number) => act.isPending && act.variables?.id === id;

  return (
    <div className="space-y-4">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          setQ(input.trim());
        }}
        className="flex gap-2"
      >
        <label htmlFor="payment-search" className="sr-only">
          Search payments
        </label>
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-ink" aria-hidden />
          <input
            id="payment-search"
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Receipt, phone, order #, customer, request id"
            className="h-11 w-full rounded-full border border-border bg-white pr-4 pl-10 text-sm text-ink focus:border-mauve focus:outline-none"
          />
        </div>
        <button type="submit" className="min-h-11 rounded-full bg-ink px-5 text-sm font-semibold text-white hover:bg-ink-hover">
          Search
        </button>
        {q && (
          <button
            type="button"
            onClick={() => {
              setInput("");
              setQ("");
            }}
            className={actionButton}
          >
            Clear
          </button>
        )}
      </form>

      <div className="no-scrollbar flex gap-2 overflow-x-auto" role="group" aria-label="Filter by status">
        {FILTERS.map((s) => (
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
            {s}
          </button>
        ))}
      </div>

      <TableBox>
        <table className="w-full min-w-5xl">
          <thead className="border-b border-border">
            <tr>
              <th className={th}>Payment</th>
              <th className={th}>Order / customer</th>
              <th className={th}>Phone</th>
              <th className={`${th} text-right`}>Amount</th>
              <th className={th}>M-Pesa receipt</th>
              <th className={th}>Status</th>
              <th className={th}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {payments.length === 0 && (
              <tr>
                <td colSpan={7} className={`${td} py-10 text-center`}>
                  No payments match.
                </td>
              </tr>
            )}
            {payments.map((p) => {
              const review = p.status === "paid" && p.orderStatus === "pending";
              return (
                <tr key={p.id} className={review ? "bg-amber-50" : undefined}>
                  <td className={td}>
                    <p className="font-semibold text-ink">#{p.id}</p>
                    <p className="whitespace-nowrap text-xs text-muted-ink">Started {formatOrderDate(new Date(p.createdAt))}</p>
                    {p.paidAt && <p className="whitespace-nowrap text-xs text-muted-ink">Paid {formatOrderDate(new Date(p.paidAt))}</p>}
                  </td>
                  <td className={td}>
                    <Link href={`/order/${p.orderId}`} className="font-semibold text-ink hover:text-mauve">
                      Order #{p.orderId}
                    </Link>
                    <p className="font-medium text-ink">{p.customerName}</p>
                    <p className="text-xs text-muted-ink">{p.customerEmail}</p>
                  </td>
                  <td className={`${td} whitespace-nowrap`}>{p.phone}</td>
                  <td className={`${td} whitespace-nowrap text-right font-semibold text-ink`}>{formatKES(p.amount)}</td>
                  <td className={td}>
                    <p className="font-mono text-xs text-ink">{p.mpesaReceipt ?? "—"}</p>
                    <p className="max-w-56 text-xs text-muted-ink" title={p.checkoutRequestId}>
                      {p.resultDesc}
                    </p>
                  </td>
                  <td className={td}>
                    <StatusBadge status={p.status} />
                    {review && <p className="mt-1 max-w-40 text-xs font-semibold text-amber-800">Needs review: paid, stock short or order not completed</p>}
                  </td>
                  <td className={td}>
                    <div className="flex flex-wrap gap-2">
                      {p.status === "pending" && (
                        <button type="button" disabled={busy(p.id)} onClick={() => act.mutate({ id: p.id, action: "requery" })} className={actionButton}>
                          Check with M-Pesa
                        </button>
                      )}
                      {p.status !== "paid" && (
                        <button type="button" disabled={busy(p.id)} onClick={() => markPaid(p)} className={actionButton}>
                          Mark as paid
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableBox>
      <p className="text-xs text-muted-ink">Showing the latest 300 matching payments.</p>
    </div>
  );
}
