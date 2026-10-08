import { and, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, products, users } from "@/db/schema";
import { attachItems, type OrderWithItems } from "@/lib/orders";
import { variantLabel } from "@/lib/product-options";
import { getSettings } from "@/lib/settings";

/* ---------- orders ---------- */

export type AdminOrder = OrderWithItems & { customerName: string; customerEmail: string };

export async function listAdminOrders(status?: string): Promise<AdminOrder[]> {
  const rows = await db
    .select({ order: orders, firstName: users.firstName, lastName: users.lastName, email: users.email })
    .from(orders)
    .innerJoin(users, eq(users.id, orders.userId))
    .where(status ? eq(orders.status, status) : undefined)
    .orderBy(desc(orders.createdAt), desc(orders.id))
    .limit(500);

  const withItems = await attachItems(rows.map((r) => r.order));
  return withItems.map((o, i) => ({
    ...o,
    customerName: `${rows[i].firstName} ${rows[i].lastName}`.trim(),
    customerEmail: rows[i].email,
  }));
}

/* ---------- customers ---------- */

export type AdminCustomer = {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
  createdAt: Date;
  orders: number;
  /** Whole KES from orders that are paid. */
  spent: number;
};

export async function listCustomers(): Promise<AdminCustomer[]> {
  const rows = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      isAdmin: users.isAdmin,
      createdAt: users.createdAt,
      orders: count(orders.id),
      spent: sql<string>`coalesce(sum(case when ${orders.paymentStatus} = 'paid' then ${orders.total} else 0 end), 0)`,
    })
    .from(users)
    .leftJoin(orders, eq(orders.userId, users.id))
    .groupBy(users.id)
    .orderBy(desc(users.createdAt));

  return rows.map((r) => ({
    id: r.id,
    name: `${r.firstName} ${r.lastName}`.trim(),
    email: r.email,
    isAdmin: r.isAdmin,
    createdAt: r.createdAt,
    orders: Number(r.orders),
    spent: Number(r.spent),
  }));
}

/* ---------- analytics ---------- */

export type Analytics = {
  revenue: number;
  paidOrders: number;
  orderCounts: Record<string, number>;
  /** Paid but still pending: the stock ran out as the payment arrived. Needs a refund or a restock. */
  needsReview: number;
  customers: number;
  productCount: number;
  unitsInStock: number;
  /** Stock value at selling price. */
  inventoryValue: number;
  lowStockThreshold: number;
  lowStock: { productId: number; name: string; label: string | null; stock: number }[];
  outOfStockProducts: number;
  salesByCategory: { category: string; revenue: number; units: number }[];
  recentOrders: { id: number; customer: string; total: number; status: string; paymentStatus: string; createdAt: Date }[];
};

export async function getAnalytics(): Promise<Analytics> {
  const settings = await getSettings();

  const [paid] = await db
    .select({ revenue: sql<string>`coalesce(sum(${orders.total}), 0)`, n: count() })
    .from(orders)
    .where(eq(orders.paymentStatus, "paid"));

  const statusRows = await db.select({ status: orders.status, n: count() }).from(orders).groupBy(orders.status);
  const [review] = await db
    .select({ n: count() })
    .from(orders)
    .where(and(eq(orders.paymentStatus, "paid"), eq(orders.status, "pending")));
  const [customers] = await db.select({ n: count() }).from(users).where(eq(users.isAdmin, false));

  const productRows = await db.select().from(products);
  const unitsInStock = productRows.reduce((n, p) => n + p.stock, 0);
  const inventoryValue = productRows.reduce((n, p) => n + p.stock * p.price, 0);

  const lowStock: Analytics["lowStock"] = [];
  for (const p of productRows) {
    if (p.variants.length === 0) {
      if (p.stock <= settings.lowStockThreshold) lowStock.push({ productId: p.id, name: p.name, label: null, stock: p.stock });
      continue;
    }
    for (const v of p.variants) {
      if (v.stock <= settings.lowStockThreshold) {
        lowStock.push({ productId: p.id, name: p.name, label: variantLabel(v) || null, stock: v.stock });
      }
    }
  }
  lowStock.sort((a, b) => a.stock - b.stock || a.name.localeCompare(b.name));

  const sales = await db
    .select({
      category: products.category,
      revenue: sql<string>`sum(${orderItems.price} * ${orderItems.quantity})`,
      units: sql<string>`sum(${orderItems.quantity})`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .innerJoin(products, eq(products.id, orderItems.productId))
    .where(eq(orders.paymentStatus, "paid"))
    .groupBy(products.category)
    .orderBy(desc(sql`sum(${orderItems.price} * ${orderItems.quantity})`));

  const recent = await db
    .select({ order: orders, firstName: users.firstName, lastName: users.lastName })
    .from(orders)
    .innerJoin(users, eq(users.id, orders.userId))
    .orderBy(desc(orders.createdAt), desc(orders.id))
    .limit(6);

  return {
    revenue: Number(paid.revenue),
    paidOrders: Number(paid.n),
    orderCounts: Object.fromEntries(statusRows.map((r) => [r.status, Number(r.n)])),
    needsReview: Number(review.n),
    customers: Number(customers.n),
    productCount: productRows.length,
    unitsInStock,
    inventoryValue,
    lowStockThreshold: settings.lowStockThreshold,
    lowStock: lowStock.slice(0, 30),
    outOfStockProducts: productRows.filter((p) => p.stock <= 0).length,
    salesByCategory: sales.map((s) => ({ category: s.category, revenue: Number(s.revenue), units: Number(s.units) })),
    recentOrders: recent.map((r) => ({
      id: r.order.id,
      customer: `${r.firstName} ${r.lastName}`.trim(),
      total: r.order.total,
      status: r.order.status,
      paymentStatus: r.order.paymentStatus,
      createdAt: r.order.createdAt,
    })),
  };
}

/* ---------- CSV ---------- */

/** Quotes a cell, and defuses spreadsheet formulas ("=", "+", "-", "@") in text that came from users. */
function cell(value: unknown): string {
  let text = value === null || value === undefined ? "" : value instanceof Date ? value.toISOString() : String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(header: string[], rows: unknown[][]): string {
  return [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}

export async function exportCsv(type: "orders" | "products" | "customers"): Promise<string> {
  if (type === "orders") {
    const list = await listAdminOrders();
    return toCsv(
      ["Order", "Date (UTC)", "Customer", "Email", "Phone", "County", "Address", "Items", "Subtotal KES", "Delivery KES", "Total KES", "Status", "Payment"],
      list.map((o) => [
        o.id,
        o.createdAt,
        o.customerName,
        o.customerEmail,
        o.deliveryPhone,
        o.deliveryCounty,
        o.deliveryAddress,
        o.items.map((i) => `${i.quantity} x ${i.productName}${i.variantLabel ? ` (${i.variantLabel})` : ""}`).join("; "),
        o.total - o.deliveryFee,
        o.deliveryFee,
        o.total,
        o.status,
        o.paymentStatus,
      ])
    );
  }
  if (type === "products") {
    const list = await db.select().from(products).orderBy(products.id);
    return toCsv(
      ["ID", "Name", "Category", "Type", "Brand", "Price KES", "Stock", "Variants", "Featured", "Best seller", "New arrival"],
      list.map((p) => [
        p.id,
        p.name,
        p.category,
        p.subcategory,
        p.brand,
        p.price,
        p.stock,
        p.variants.map((v) => `${variantLabel(v) || "-"}: ${v.stock}`).join("; "),
        p.featured ? "yes" : "no",
        p.bestSeller ? "yes" : "no",
        p.newArrival ? "yes" : "no",
      ])
    );
  }
  const list = await listCustomers();
  return toCsv(
    ["ID", "Name", "Email", "Admin", "Joined (UTC)", "Orders", "Spent KES"],
    list.map((c) => [c.id, c.name, c.email, c.isAdmin ? "yes" : "no", c.createdAt, c.orders, c.spent])
  );
}
