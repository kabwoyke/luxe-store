"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type Serialized } from "@/lib/admin-api";
import type { AdminCustomer } from "@/lib/admin-data";
import { formatKES } from "@/lib/format";
import { formatOrderDate } from "@/components/orders/order-parts";
import { ErrorNote, Loading, TableBox, td, th } from "./ui";

type Customer = Serialized<AdminCustomer>;

export function CustomersTab() {
  const [search, setSearch] = useState("");
  const { data, error, isPending } = useQuery({
    queryKey: ["admin", "customers"],
    queryFn: () => api<{ customers: Customer[] }>("/api/admin/customers"),
  });

  if (error) return <ErrorNote error={error} />;
  if (isPending) return <Loading label="Loading customers" />;

  const q = search.trim().toLowerCase();
  const list = q ? data.customers.filter((c) => `${c.name} ${c.email}`.toLowerCase().includes(q)) : data.customers;

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="customer-search" className="sr-only">
          Search customers
        </label>
        <input
          id="customer-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="h-11 w-full rounded-full border border-border bg-white px-5 text-sm focus:border-mauve focus:outline-none sm:max-w-sm"
        />
      </div>
      <TableBox>
        <table className="w-full min-w-[40rem]">
          <thead className="border-b border-border">
            <tr>
              <th className={th}>Customer</th>
              <th className={th}>Joined</th>
              <th className={`${th} text-right`}>Orders</th>
              <th className={`${th} text-right`}>Spent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.length === 0 && (
              <tr>
                <td colSpan={4} className={`${td} py-10 text-center`}>
                  No customers found.
                </td>
              </tr>
            )}
            {list.map((c) => (
              <tr key={c.id}>
                <td className={td}>
                  <p className="font-medium text-ink">
                    {c.name}
                    {c.isAdmin && <span className="ml-2 rounded-full bg-blush px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-mauve-dark">Admin</span>}
                  </p>
                  <p className="text-xs text-muted-ink">{c.email}</p>
                </td>
                <td className={`${td} whitespace-nowrap`}>{formatOrderDate(new Date(c.createdAt))}</td>
                <td className={`${td} text-right`}>{c.orders}</td>
                <td className={`${td} text-right font-semibold text-ink`}>{formatKES(c.spent)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableBox>
    </div>
  );
}
