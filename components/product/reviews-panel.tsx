import { Star } from "lucide-react";
import type { reviews } from "@/db/schema";
import { cn } from "@/lib/utils";
import { ReviewForm } from "./review-form";

type Review = typeof reviews.$inferSelect;

const dateFormat = new Intl.DateTimeFormat("en-KE", {
  dateStyle: "medium",
  timeZone: "Africa/Nairobi",
});

export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("inline-flex", className)} role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cn("size-4", n <= Math.round(value) ? "fill-warn text-warn" : "text-border")} />
      ))}
    </span>
  );
}

export function ReviewsPanel({ productId, reviews }: { productId: number; reviews: Review[] }) {
  const average = reviews.length ? reviews.reduce((n, r) => n + r.rating, 0) / reviews.length : 0;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <div>
        {reviews.length === 0 ? (
          <p className="text-body">No reviews yet. Be the first to share your thoughts.</p>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-3">
              <span className="font-heading text-3xl font-bold text-ink">{average.toFixed(1)}</span>
              <div>
                <Stars value={average} />
                <p className="text-xs text-muted-ink">
                  {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                </p>
              </div>
            </div>
            <ul className="divide-y divide-border">
              {reviews.map((r) => (
                <li key={r.id} className="space-y-1 py-4">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <Stars value={r.rating} />
                    <span className="text-sm font-semibold text-ink">{r.userName}</span>
                    <span className="text-xs text-muted-ink">{dateFormat.format(r.createdAt)}</span>
                  </div>
                  <p className="text-sm text-body">{r.comment}</p>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      <ReviewForm productId={productId} />
    </div>
  );
}
