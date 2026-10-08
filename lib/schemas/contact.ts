import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(150),
  email: z.email("Please enter a valid email address").max(191),
  phone: z.string().trim().max(30).optional(),
  message: z.string().trim().min(10, "Please write at least a short sentence").max(2000),
  /** Honeypot: hidden from people, filled in by bots. Must stay empty. */
  website: z.string().max(200).optional(),
});

export type ContactInput = z.input<typeof contactSchema>;
