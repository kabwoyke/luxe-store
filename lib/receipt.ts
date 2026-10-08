import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { payments } from "@/db/schema";
import type { OrderWithItems } from "@/lib/orders";
import { formatKES } from "@/lib/format";

/**
 * Receipt PDF for a paid order. The data itself lives in the database (payments and orders tables);
 * this only renders it. Built with the standard PDF fonts, which only cover Latin-1 text.
 */

const latin1 = (text: string) => text.replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");

const dateFormat = new Intl.DateTimeFormat("en-KE", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Africa/Nairobi",
});

/** 254712345678 -> 2547****5678 */
const maskPhone = (phone: string) => (phone.length >= 8 ? `${phone.slice(0, 4)}****${phone.slice(-4)}` : phone);

export type Receipt = { fileName: string; bytes: Uint8Array };

export async function buildReceipt(order: OrderWithItems): Promise<Receipt | null> {
  // The payment that settled the order is the most recent one with status "paid".
  const all = await db.select().from(payments).where(eq(payments.orderId, order.id)).orderBy(desc(payments.id));
  const paid = all.find((p) => p.status === "paid");
  if (!paid || order.paymentStatus !== "paid") return null;

  const receiptNo = paid.mpesaReceipt ?? `LUXE-${String(paid.id).padStart(6, "0")}`;

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]); // A4
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.176, 0.102, 0.176);
  const mauve = rgb(0.561, 0.267, 0.392);
  const muted = rgb(0.48, 0.38, 0.44);
  const margin = 48;
  const width = 595 - margin * 2;
  let y = 842 - margin;

  const text = (value: string, x: number, size = 10, font: PDFFont = regular, color = ink) =>
    page.drawText(latin1(value), { x, y, size, font, color });
  const right = (value: string, size = 10, font: PDFFont = regular, color = ink) =>
    page.drawText(latin1(value), { x: margin + width - font.widthOfTextAtSize(latin1(value), size), y, size, font, color });
  const rule = () => page.drawLine({ start: { x: margin, y }, end: { x: margin + width, y }, thickness: 0.6, color: rgb(0.94, 0.87, 0.91) });

  text("LUXE", margin, 22, bold, ink);
  page.drawText("STORE", { x: margin + bold.widthOfTextAtSize("LUXE", 22), y, size: 22, font: bold, color: rgb(0.608, 0.369, 0.478) });
  right("PAYMENT RECEIPT", 11, bold, mauve);
  y -= 34;

  const meta: [string, string][] = [
    ["Receipt number", receiptNo],
    ["Order", `#${order.id}`],
    ["Date paid", dateFormat.format(paid.updatedAt)],
    ["Payment method", `M-Pesa (${maskPhone(paid.phone)})`],
    ["Billed to", order.deliveryName],
  ];
  for (const [label, value] of meta) {
    text(label, margin, 9, regular, muted);
    text(value, margin + 120, 10, bold);
    y -= 16;
  }

  y -= 8;
  text("Delivery address", margin, 9, regular, muted);
  const address = [order.deliveryAddress, order.deliveryCounty].filter(Boolean).join(", ");
  text(address.length > 80 ? address.slice(0, 77) + "..." : address, margin + 120, 10);
  y -= 26;

  rule();
  y -= 16;
  text("ITEM", margin, 8, bold, muted);
  page.drawText("QTY", { x: margin + 330, y, size: 8, font: bold, color: muted });
  page.drawText("PRICE", { x: margin + 375, y, size: 8, font: bold, color: muted });
  right("TOTAL", 8, bold, muted);
  y -= 8;
  rule();
  y -= 16;

  for (const item of order.items) {
    const name = item.productName.length > 48 ? item.productName.slice(0, 45) + "..." : item.productName;
    text(name, margin, 10, bold);
    page.drawText(String(item.quantity), { x: margin + 332, y, size: 10, font: regular, color: ink });
    page.drawText(formatKES(item.price), { x: margin + 375, y, size: 10, font: regular, color: ink });
    right(formatKES(item.price * item.quantity), 10, regular);
    if (item.variantLabel) {
      y -= 13;
      text(item.variantLabel, margin, 9, regular, muted);
    }
    y -= 20;
  }

  rule();
  y -= 18;
  const subtotal = order.total - order.deliveryFee;
  const totals: [string, string, boolean][] = [
    ["Subtotal", formatKES(subtotal), false],
    ["Delivery", order.deliveryFee === 0 ? "Free" : formatKES(order.deliveryFee), false],
    ["Total paid", formatKES(order.total), true],
  ];
  for (const [label, value, strong] of totals) {
    page.drawText(label, { x: margin + 330, y, size: strong ? 12 : 10, font: strong ? bold : regular, color: strong ? mauve : ink });
    right(value, strong ? 12 : 10, strong ? bold : regular, strong ? mauve : ink);
    y -= strong ? 20 : 16;
  }

  y -= 24;
  text("Thank you for shopping with LUXESTORE. Your everyday luxury, curated for you.", margin, 9, regular, muted);
  y -= 13;
  text("Keep this receipt for your records. Questions? Reply to your order confirmation or contact us through the website.", margin, 8, regular, muted);

  return { fileName: `LUXESTORE-receipt-order-${order.id}.pdf`, bytes: await pdf.save() };
}
