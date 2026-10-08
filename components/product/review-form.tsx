"use client";

import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { reviewSchema, type ReviewInput } from "@/lib/schemas/review";
import { cn } from "@/lib/utils";

export function ReviewForm({ productId }: { productId: number }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReviewInput>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { productId, userName: "", rating: 0, comment: "" },
  });
  const rating = useWatch({ control, name: "rating" });

  async function onSubmit(values: ReviewInput) {
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Could not post your review.");
      return;
    }
    toast.success("Thank you for your review!");
    reset({ productId, userName: "", rating: 0, comment: "" });
    router.refresh();
  }

  const field =
    "w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-ink focus:border-mauve focus:outline-none";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-3xl border border-border bg-white p-5" noValidate>
      <h3 className="text-lg font-bold">Write a review</h3>

      <div>
        <p className="mb-1 text-sm text-body" id="rating-label">
          Your rating
        </p>
        <div role="radiogroup" aria-labelledby="rating-label" className="flex">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              onClick={() => setValue("rating", n, { shouldValidate: true })}
              className="grid size-10 place-items-center"
            >
              <Star className={cn("size-6", n <= rating ? "fill-warn text-warn" : "text-border")} />
            </button>
          ))}
        </div>
        {errors.rating && <p className="text-xs text-destructive">{errors.rating.message}</p>}
      </div>

      <div>
        <label htmlFor="review-name" className="mb-1 block text-sm text-body">
          Your name
        </label>
        <input id="review-name" className={field} {...register("userName")} />
        {errors.userName && <p className="mt-1 text-xs text-destructive">{errors.userName.message}</p>}
      </div>

      <div>
        <label htmlFor="review-comment" className="mb-1 block text-sm text-body">
          Your review
        </label>
        <textarea id="review-comment" rows={4} className={field} {...register("comment")} />
        {errors.comment && <p className="mt-1 text-xs text-destructive">{errors.comment.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="h-11 rounded-full bg-ink px-6 text-sm font-semibold text-white hover:bg-ink-hover disabled:opacity-60"
      >
        {isSubmitting ? "Posting…" : "Post review"}
      </button>
    </form>
  );
}
