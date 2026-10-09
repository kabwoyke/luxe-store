import { revalidateTag } from "next/cache";
import { and, asc, desc, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/db";
import { inventoryLogs, orderItems, orders, payments, products } from "@/db/schema";
import { MpesaApiError, MpesaConfigError, stkPush, stkQuery } from "@/lib/mpesa/daraja";
import { sumVariantStock, type Variant } from "@/lib/product-options";

/*
 * STOCK SAFETY (decision): stock is not reserved when an order is created. It is re-checked and
 * deducted inside the payment-confirmation transaction, with the product rows locked
 * (select ... for update), so two simultaneous payments can never oversell.
 * If the money arrived but the stock is gone, the payment is recorded as paid, the order keeps
 * status "pending" with paymentStatus "paid", and an inventory log entry
 * "needs-review" is written. That combination (paid + pending) means "refund or restock".
 */

const PROMPT_COOLDOWN_MS = 30_000;
const QUERY_AFTER_MS = 20_000;
const QUERY_EVERY_MS = 10_000;
const CANCELLED_BY_USER = 1032;

type Db = Parameters<Parameters<typeof db.transaction>[0]>[0];
type OrderItemRow = typeof orderItems.$inferSelect;
type ProductRow = typeof products.$inferSelect;

/* ---------- stock helpers ---------- */

type StockProblem = { productId: number; name: string; available: number; wanted: number };

/** Applies an order's lines to product rows. Returns the changes, or what is short. */
function planDeduction(items: OrderItemRow[], rows: ProductRow[]) {
  const byId = new Map(rows.map((p) => [p.id, p]));
  const variantsByProduct = new Map<number, Variant[]>(rows.map((p) => [p.id, p.variants.map((v) => ({ ...v }))]));
  const stockByProduct = new Map<number, number>(rows.map((p) => [p.id, p.stock]));
  const problems: StockProblem[] = [];

  for (const item of items) {
    const product = byId.get(item.productId);
    if (!product) {
      problems.push({ productId: item.productId, name: item.productName, available: 0, wanted: item.quantity });
      continue;
    }
    if (item.variantId) {
      const variant = variantsByProduct.get(product.id)!.find((v) => v.id === item.variantId);
      if (!variant || variant.stock < item.quantity) {
        problems.push({ productId: product.id, name: item.productName, available: variant?.stock ?? 0, wanted: item.quantity });
      } else {
        variant.stock -= item.quantity;
      }
    } else {
      const available = stockByProduct.get(product.id)!;
      if (available < item.quantity) {
        problems.push({ productId: product.id, name: item.productName, available, wanted: item.quantity });
      } else {
        stockByProduct.set(product.id, available - item.quantity);
      }
    }
  }
  return { problems, variantsByProduct, stockByProduct };
}

async function loadItems(tx: Db | typeof db, orderId: number) {
  return tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

/* ---------- start a payment ---------- */

export type StartPaymentResult =
  | { ok: true; paymentId: number; checkoutRequestId: string; message: string }
  | { ok: false; status: number; error: string };

/** Validates the order, asks Daraja to prompt the customer's phone, and records a pending payment. */
export async function startPayment(
  userId: number,
  input: { orderId: number; phone: string }
): Promise<StartPaymentResult> {
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, input.orderId), eq(orders.userId, userId)));
  if (!order) return { ok: false, status: 404, error: "Order not found." };
  if (order.status !== "pending" || order.paymentStatus === "paid") {
    return { ok: false, status: 409, error: "This order has already been paid for or closed." };
  }

  // Do not take a customer's money for something we can no longer supply.
  const items = await loadItems(db, order.id);
  const rows = await db
    .select()
    .from(products)
    .where(
      inArray(
        products.id,
        items.map((i) => i.productId)
      )
    );
  const { problems } = planDeduction(items, rows);
  if (problems.length > 0) {
    const p = problems[0];
    return {
      ok: false,
      status: 409,
      error: p.available > 0 ? `Only ${p.available} left of ${p.name}.` : `${p.name} is sold out.`,
    };
  }

  // A double tap or a second tab must not send the customer a second prompt for the same order.
  const [recent] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.orderId, order.id), eq(payments.status, "pending")))
    .orderBy(desc(payments.id))
    .limit(1);
  if (recent && Date.now() - recent.createdAt.getTime() < PROMPT_COOLDOWN_MS) {
    return {
      ok: true,
      paymentId: recent.id,
      checkoutRequestId: recent.checkoutRequestId,
      message: "A payment prompt was just sent. Check your phone and enter your M-Pesa PIN.",
    };
  }

  let result;
  try {
    // The amount always comes from the order row, never from the request.
    result = await stkPush({ orderId: order.id, phone: input.phone, amount: order.total });
  } catch (err) {
    if (err instanceof MpesaConfigError) {
      console.error("[mpesa]", err.message);
      return { ok: false, status: 503, error: "M-Pesa payments are not available yet. Please try again later." };
    }
    if (err instanceof MpesaApiError) {
      console.error("[mpesa] stkpush failed:", err.message, err.status ?? "", err.code ?? "");
      return { ok: false, status: 502, error: "M-Pesa could not send the payment prompt. Please check the number and try again." };
    }
    throw err;
  }

  const [created] = await db.insert(payments).values({
    orderId: order.id,
    merchantRequestId: result.merchantRequestId,
    checkoutRequestId: result.checkoutRequestId,
    phone: input.phone,
    amount: order.total,
    status: "pending",
  });
  // A retry after a failed or cancelled attempt puts the order back to waiting.
  await db.update(orders).set({ paymentStatus: "pending" }).where(eq(orders.id, order.id));

  return { ok: true, paymentId: created.insertId, checkoutRequestId: result.checkoutRequestId, message: result.customerMessage };
}

/* ---------- apply a result (callback or STK query) ---------- */

export type PaymentOutcome =
  | "unknown"
  | "rejected"
  | "receipt-reused"
  | "already-final"
  | "failed"
  | "cancelled"
  | "amount-mismatch"
  | "duplicate"
  | "paid"
  | "paid-needs-review";

export type PaymentResultInput = {
  checkoutRequestId: string;
  /** Present in callbacks; when given it must match the one we stored at STK Push time. */
  merchantRequestId?: string;
  resultCode: number;
  resultDesc: string;
  /** Present in callbacks, absent when the result comes from an STK query. */
  receipt?: string;
  /** M-Pesa TransactionDate, present in callbacks only. */
  paidAt?: Date;
  amount?: number;
};

/**
 * Records the outcome of a payment. Safe to call any number of times for the same payment
 * (Safaricom can deliver a callback twice, and polling can race it): the payment row is locked,
 * and anything already final is left alone.
 */
export async function applyPaymentResult(input: PaymentResultInput): Promise<PaymentOutcome> {
  const outcome = await db.transaction(async (tx): Promise<PaymentOutcome> => {
    const [payment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.checkoutRequestId, input.checkoutRequestId))
      .for("update");
    if (!payment) return "unknown";
    if (input.merchantRequestId && input.merchantRequestId !== payment.merchantRequestId) return "rejected";

    if (payment.status !== "pending") {
      // A late callback may still carry the receipt that an STK query could not provide.
      if (payment.status === "paid" && !payment.mpesaReceipt && input.receipt) {
        await tx
          .update(payments)
          .set({ mpesaReceipt: input.receipt, paidAt: input.paidAt ?? payment.paidAt })
          .where(eq(payments.id, payment.id));
      }
      return "already-final";
    }

    // Failed or cancelled prompt: the order stays pending so the customer can try again.
    if (input.resultCode !== 0) {
      const status = input.resultCode === CANCELLED_BY_USER ? "cancelled" : "failed";
      await tx
        .update(payments)
        .set({ status, resultCode: input.resultCode, resultDesc: input.resultDesc.slice(0, 255) })
        .where(eq(payments.id, payment.id));
      await tx
        .update(orders)
        .set({ paymentStatus: status })
        .where(and(eq(orders.id, payment.orderId), eq(orders.paymentStatus, "pending")));
      return status;
    }

    // A receipt number that already paid something else is a replayed or forged callback.
    if (input.receipt) {
      const [used] = await tx
        .select({ id: payments.id })
        .from(payments)
        .where(and(eq(payments.mpesaReceipt, input.receipt), ne(payments.id, payment.id)))
        .limit(1);
      if (used) {
        await tx
          .update(payments)
          .set({
            status: "failed",
            resultCode: input.resultCode,
            resultDesc: `Receipt ${input.receipt} is already recorded on payment #${used.id}. Needs manual review.`.slice(0, 255),
          })
          .where(eq(payments.id, payment.id));
        return "receipt-reused";
      }
    }

    const [order] = await tx.select().from(orders).where(eq(orders.id, payment.orderId)).for("update");
    const received = input.amount ?? payment.amount;
    if (!order || received !== payment.amount || order.total !== payment.amount) {
      await tx
        .update(payments)
        .set({
          status: "failed",
          resultCode: input.resultCode,
          resultDesc: `Amount mismatch: received ${received}, expected ${order?.total ?? "?"}. Needs manual review.`,
          mpesaReceipt: input.receipt ?? null,
          paidAt: input.paidAt ?? null,
        })
        .where(eq(payments.id, payment.id));
      return "amount-mismatch";
    }

    if (order.paymentStatus === "paid") {
      await tx
        .update(payments)
        .set({
          status: "paid",
          resultCode: 0,
          resultDesc: "Duplicate payment: the order was already paid. Refund needed.",
          mpesaReceipt: input.receipt ?? null,
          paidAt: input.paidAt ?? null,
        })
        .where(eq(payments.id, payment.id));
      return "duplicate";
    }

    // Lock the product rows (in id order, so concurrent payments cannot deadlock) and re-check stock.
    const items = await loadItems(tx, order.id);
    const rows = await tx
      .select()
      .from(products)
      .where(
        inArray(
          products.id,
          items.map((i) => i.productId)
        )
      )
      .orderBy(asc(products.id))
      .for("update");

    const plan = planDeduction(items, rows);
    const paidFields = { status: "paid" as const, resultCode: 0, resultDesc: input.resultDesc.slice(0, 255), mpesaReceipt: input.receipt ?? null, paidAt: input.paidAt ?? null };

    if (plan.problems.length > 0) {
      await tx.update(payments).set(paidFields).where(eq(payments.id, payment.id));
      await tx.update(orders).set({ paymentStatus: "paid" }).where(eq(orders.id, order.id));
      await tx.insert(inventoryLogs).values(
        plan.problems.map((p) => ({
          productId: p.productId,
          variantId: null,
          change: 0,
          reason: `needs-review: paid but only ${p.available} of ${p.wanted} in stock`.slice(0, 100),
          orderId: order.id,
        }))
      );
      return "paid-needs-review";
    }

    for (const product of rows) {
      const variants = plan.variantsByProduct.get(product.id)!;
      const stock = variants.length > 0 ? sumVariantStock(variants) : plan.stockByProduct.get(product.id)!;
      await tx.update(products).set({ variants, stock }).where(eq(products.id, product.id));
    }
    await tx.insert(inventoryLogs).values(
      items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        change: -i.quantity,
        reason: "sale",
        orderId: order.id,
      }))
    );
    await tx.update(orders).set({ status: "paid", paymentStatus: "paid" }).where(eq(orders.id, order.id));
    await tx.update(payments).set(paidFields).where(eq(payments.id, payment.id));
    return "paid";
  });

  if (outcome === "paid") revalidateTag("products", { expire: 0 });
  return outcome;
}

/* ---------- polling support ---------- */

const lastQueried = new Map<string, number>();

/**
 * If a prompt has been pending for a while, ask Daraja directly (the callback may have been missed).
 * Throttled, and never throws: polling must keep working even when Daraja is down.
 */
export async function reconcilePayment(payment: typeof payments.$inferSelect): Promise<void> {
  if (payment.status !== "pending") return;
  const now = Date.now();
  if (now - payment.createdAt.getTime() < QUERY_AFTER_MS) return;
  if (now - (lastQueried.get(payment.checkoutRequestId) ?? 0) < QUERY_EVERY_MS) return;
  lastQueried.set(payment.checkoutRequestId, now);

  try {
    const result = await stkQuery(payment.checkoutRequestId);
    if (result.state === "final") {
      await applyPaymentResult({
        checkoutRequestId: payment.checkoutRequestId,
        resultCode: result.resultCode,
        resultDesc: result.resultDesc,
      });
    }
  } catch (err) {
    console.error("[mpesa] stk query failed:", err instanceof Error ? err.message : err);
  }
}

export type PaymentStatusView = {
  orderStatus: string;
  paymentStatus: string;
  payment: null | {
    id: number;
    status: string;
    phone: string;
    resultCode: number | null;
    resultDesc: string | null;
    mpesaReceipt: string | null;
    paidAt: Date | null;
    createdAt: Date;
  };
};

/** Latest payment for an order, reconciling with Daraja first when it has been pending a while. */
export async function getPaymentStatus(orderId: number): Promise<PaymentStatusView | null> {
  const latest = () =>
    db.select().from(payments).where(eq(payments.orderId, orderId)).orderBy(desc(payments.id)).limit(1);

  let [payment] = await latest();
  if (payment) {
    await reconcilePayment(payment);
    [payment] = await latest();
  }
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) return null;

  return {
    orderStatus: order.status,
    paymentStatus: order.paymentStatus,
    payment: payment
      ? {
          id: payment.id,
          status: payment.status,
          phone: payment.phone,
          resultCode: payment.resultCode,
          resultDesc: payment.resultDesc,
          mpesaReceipt: payment.mpesaReceipt,
          paidAt: payment.paidAt,
          createdAt: payment.createdAt,
        }
      : null,
  };
}

/** Milliseconds since a moment, for showing how long a prompt has been waiting. */
export function msSince(date: Date): number {
  return Date.now() - date.getTime();
}

/* ---------- admin actions ---------- */

export type AdminPaymentResult = { ok: true; message: string } | { ok: false; status: number; error: string };

/** Asks Daraja right now (no throttle) what happened to a pending prompt and applies the answer. */
export async function adminRequeryPayment(paymentId: number): Promise<AdminPaymentResult> {
  const [payment] = await db.select().from(payments).where(eq(payments.id, paymentId));
  if (!payment) return { ok: false, status: 404, error: "Payment not found." };
  if (payment.status !== "pending") return { ok: false, status: 409, error: `This payment is already ${payment.status}.` };

  try {
    const result = await stkQuery(payment.checkoutRequestId);
    if (result.state === "pending") return { ok: true, message: "Still waiting for the customer to enter their PIN." };
    const outcome = await applyPaymentResult({
      checkoutRequestId: payment.checkoutRequestId,
      resultCode: result.resultCode,
      resultDesc: result.resultDesc,
    });
    return { ok: true, message: `M-Pesa says: ${result.resultDesc || "done"} (${outcome}).` };
  } catch (err) {
    if (err instanceof MpesaConfigError || err instanceof MpesaApiError) {
      return { ok: false, status: 502, error: err.message };
    }
    throw err;
  }
}

/**
 * For money that arrived but whose callback never did (an STK query cannot return the receipt):
 * the admin supplies the M-Pesa receipt code from the statement. Stock is deducted exactly as for a callback.
 */
export async function adminMarkPaid(paymentId: number, receipt: string): Promise<AdminPaymentResult> {
  const [payment] = await db.select().from(payments).where(eq(payments.id, paymentId));
  if (!payment) return { ok: false, status: 404, error: "Payment not found." };
  if (payment.status === "paid") return { ok: false, status: 409, error: "This payment is already paid." };

  const [taken] = await db.select({ id: payments.id }).from(payments).where(eq(payments.mpesaReceipt, receipt)).limit(1);
  if (taken) return { ok: false, status: 409, error: `Receipt ${receipt} is already recorded on payment #${taken.id}.` };

  // applyPaymentResult only acts on pending payments, so reopen this one first and put it back if nothing was applied.
  await db.update(payments).set({ status: "pending" }).where(eq(payments.id, payment.id));
  const outcome = await applyPaymentResult({
    checkoutRequestId: payment.checkoutRequestId,
    resultCode: 0,
    resultDesc: "Marked as paid by an admin.",
    receipt,
  });
  if (outcome !== "paid" && outcome !== "paid-needs-review" && outcome !== "duplicate") {
    await db
      .update(payments)
      .set({ status: payment.status, resultCode: payment.resultCode, resultDesc: payment.resultDesc, mpesaReceipt: payment.mpesaReceipt })
      .where(eq(payments.id, payment.id));
    return { ok: false, status: 409, error: `Could not mark as paid (${outcome}).` };
  }
  const note =
    outcome === "paid-needs-review" ? " Stock was short, so the order needs review." : outcome === "duplicate" ? " The order was already paid: refund needed." : "";
  return { ok: true, message: `Payment marked as paid.${note}` };
}
