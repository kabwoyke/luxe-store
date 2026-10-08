import { z } from "zod";

/** Shared by the review form and POST /api/reviews. */
export const reviewSchema = z.object({
  productId: z.number().int().positive(),
  userName: z.string().trim().min(1, "Please enter your name").max(150),
  rating: z.number().int().min(1, "Please choose a rating").max(5),
  comment: z.string().trim().min(1, "Please write a short review").max(2000),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
