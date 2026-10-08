import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Please enter a valid email address").max(191).transform((e) => e.toLowerCase()),
  password: z.string().min(1, "Please enter your password").max(200),
});

export const signupSchema = z.object({
  firstName: z.string().trim().min(1, "Please enter your first name").max(100),
  lastName: z.string().trim().min(1, "Please enter your last name").max(100),
  email: z.email("Please enter a valid email address").max(191).transform((e) => e.toLowerCase()),
  password: z.string().min(8, "Use at least 8 characters").max(200),
});

export type LoginInput = z.input<typeof loginSchema>;
export type SignupInput = z.input<typeof signupSchema>;
