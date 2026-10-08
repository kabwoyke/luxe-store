import {
  boolean,
  index,
  int,
  json,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import type { Variant } from "@/lib/product-options";

const createdAt = () => timestamp("created_at").defaultNow().notNull();

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 191 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: createdAt(),
});

export const stores = mysqlTable("stores", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 191 }).notNull().unique(),
  color: varchar("color", { length: 20 }).default("#8f4464").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const products = mysqlTable(
  "products",
  {
    id: int("id").autoincrement().primaryKey(),
    storeId: int("store_id")
      .notNull()
      .references(() => stores.id),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description").notNull(),
    shortDescription: varchar("short_description", { length: 500 }),
    /** Integer KES. */
    price: int("price").notNull(),
    category: varchar("category", { length: 50 }).notNull(),
    subcategory: varchar("subcategory", { length: 80 }).notNull(),
    brand: varchar("brand", { length: 100 }),
    tags: json("tags").$type<string[]>().$defaultFn(() => []).notNull(),
    /** Always the sum of variant stock when variants exist. Computed on the server. */
    stock: int("stock").default(0).notNull(),
    imageUrl: varchar("image_url", { length: 1000 }).notNull(),
    images: json("images").$type<string[]>().$defaultFn(() => []).notNull(),
    attributes: json("attributes")
      .$type<Record<string, string>>()
      .$defaultFn(() => ({}))
      .notNull(),
    colorImages: json("color_images")
      .$type<Record<string, string[]>>()
      .$defaultFn(() => ({}))
      .notNull(),
    variants: json("variants").$type<Variant[]>().$defaultFn(() => []).notNull(),
    featured: boolean("featured").default(false).notNull(),
    bestSeller: boolean("best_seller").default(false).notNull(),
    newArrival: boolean("new_arrival").default(false).notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    index("products_category_subcategory_idx").on(t.category, t.subcategory),
    index("products_name_idx").on(t.name),
  ]
);

export const collections = mysqlTable("collections", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 191 }).notNull().unique(),
  description: text("description").notNull(),
  productIds: json("product_ids").$type<number[]>().$defaultFn(() => []).notNull(),
});

export const reviews = mysqlTable(
  "reviews",
  {
    id: int("id").autoincrement().primaryKey(),
    productId: int("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    userName: varchar("user_name", { length: 150 }).notNull(),
    rating: int("rating").notNull(),
    comment: text("comment").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("reviews_product_idx").on(t.productId)]
);

export const orders = mysqlTable(
  "orders",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id")
      .notNull()
      .references(() => users.id),
    storeId: int("store_id")
      .notNull()
      .references(() => stores.id),
    /** pending | paid | shipped | delivered | cancelled (validated by zod). */
    status: varchar("status", { length: 20 }).default("pending").notNull(),
    /** Integer KES, including delivery. */
    total: int("total").notNull(),
    deliveryFee: int("delivery_fee").default(0).notNull(),
    /** mpesa | card */
    paymentMethod: varchar("payment_method", { length: 20 }).default("mpesa").notNull(),
    /** pending | paid | failed | cancelled */
    paymentStatus: varchar("payment_status", { length: 20 }).default("pending").notNull(),
    deliveryName: varchar("delivery_name", { length: 150 }).notNull(),
    deliveryPhone: varchar("delivery_phone", { length: 30 }).notNull(),
    deliveryCounty: varchar("delivery_county", { length: 100 }),
    deliveryAddress: text("delivery_address").notNull(),
    deliveryNotes: text("delivery_notes"),
    createdAt: createdAt(),
  },
  (t) => [index("orders_user_idx").on(t.userId)]
);

export const orderItems = mysqlTable(
  "order_items",
  {
    id: int("id").autoincrement().primaryKey(),
    orderId: int("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: int("product_id")
      .notNull()
      .references(() => products.id),
    variantId: varchar("variant_id", { length: 100 }),
    quantity: int("quantity").notNull(),
    /** Unit price snapshot, integer KES. */
    price: int("price").notNull(),
    /** Snapshots so order views survive later product edits. */
    productName: varchar("product_name", { length: 255 }).notNull(),
    variantLabel: varchar("variant_label", { length: 150 }),
    imageUrl: varchar("image_url", { length: 1000 }),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)]
);

export const inventoryLogs = mysqlTable(
  "inventory_logs",
  {
    id: int("id").autoincrement().primaryKey(),
    productId: int("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    variantId: varchar("variant_id", { length: 100 }),
    /** Negative for sales, positive for restocks. */
    change: int("change").notNull(),
    reason: varchar("reason", { length: 100 }).notNull(),
    orderId: int("order_id"),
    createdAt: createdAt(),
  },
  (t) => [index("inventory_logs_product_idx").on(t.productId)]
);

export const newsletterSubscribers = mysqlTable("newsletter_subscribers", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 191 }).notNull().unique(),
  createdAt: createdAt(),
});

export const payments = mysqlTable(
  "payments",
  {
    id: int("id").autoincrement().primaryKey(),
    orderId: int("order_id")
      .notNull()
      .references(() => orders.id),
    merchantRequestId: varchar("merchant_request_id", { length: 100 }).notNull(),
    checkoutRequestId: varchar("checkout_request_id", { length: 100 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    amount: int("amount").notNull(),
    /** pending | paid | failed | cancelled */
    status: varchar("status", { length: 20 }).default("pending").notNull(),
    resultCode: int("result_code"),
    resultDesc: varchar("result_desc", { length: 255 }),
    mpesaReceipt: varchar("mpesa_receipt", { length: 50 }),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [
    uniqueIndex("payments_checkout_request_idx").on(t.checkoutRequestId),
    index("payments_order_idx").on(t.orderId),
  ]
);

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type User = typeof users.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Payment = typeof payments.$inferSelect;

/** Admin-editable store settings, one row per key (see lib/settings.ts). */
export const settings = mysqlTable("settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: json("value").$type<unknown>().notNull(),
});

/** Messages sent from the public contact form; admins mark them handled. */
export const contactMessages = mysqlTable("contact_messages", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  email: varchar("email", { length: 191 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  message: text("message").notNull(),
  handled: boolean("handled").default(false).notNull(),
  createdAt: createdAt(),
});
