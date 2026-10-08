import Link from "next/link";
import type { OrderWithItems } from "@/lib/orders";
import { formatKES } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ProductImage } from "@/components/shop/product-image";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
  shipped: "bg-sky-100 text-sky-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-zinc-200 text-zinc-700",
  failed: "bg-red-100 text-red-800",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider",
        STATUS_STYLE[status] ?? "bg-blush text-mauve-dark"
      )}
    >
      {status}
    </span>
  );
}

const dateFormat = new Intl.DateTimeFormat("en-KE", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Nairobi",
});

export const formatOrderDate = (date: Date) => dateFormat.format(date);

/** Lines of an order: the colour's photo, the name and `Color / Size`. */
export function OrderItems({ items }: { items: OrderWithItems["items"] }) {
  return (
    <ul className="divide-y divide-border">
      {items.map((item) => (
        <li key={item.id} className="flex gap-3 py-3">
          <Link
            href={`/products/${item.productId}`}
            className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-blush"
          >
            {item.imageUrl && (
              <ProductImage src={item.imageUrl} alt={item.productName} sizes="64px" className="object-cover" />
            )}
          </Link>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-semibold text-ink">{item.productName}</p>
            {item.variantLabel && <p className="text-xs text-muted-ink">{item.variantLabel}</p>}
            <p className="text-xs text-muted-ink">
              {item.quantity} × {formatKES(item.price)}
            </p>
          </div>
          <p className="shrink-0 text-sm font-bold text-ink">{formatKES(item.quantity * item.price)}</p>
        </li>
      ))}
    </ul>
  );
}
