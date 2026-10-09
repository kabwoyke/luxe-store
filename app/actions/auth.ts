"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { signIn, signOut } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { loginSchema, signupSchema, type LoginInput, type SignupInput } from "@/lib/schemas/auth";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function startSession(email: string, password: string): Promise<ActionResult> {
  try {
    await signIn("credentials", { email, password, redirect: false });
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: "Wrong email or password." };
    throw err;
  }
}

const TOO_MANY = { ok: false, error: "Too many attempts. Please wait a few minutes and try again." } as const;

export async function login(input: LoginInput): Promise<ActionResult> {
  if (!rateLimit(`login-ip:${clientIp(await headers())}`, 30, 15 * 60_000).ok) return TOO_MANY;
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  return startSession(parsed.data.email, parsed.data.password);
}

export async function signup(input: SignupInput): Promise<ActionResult> {
  if (!rateLimit(`signup-ip:${clientIp(await headers())}`, 5, 60 * 60_000).ok) return TOO_MANY;
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { email, password, firstName, lastName } = parsed.data;

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (existing) return { ok: false, error: "An account with that email already exists. Try logging in." };

  // isAdmin is never taken from the form: new accounts are always customers.
  await db.insert(users).values({
    email,
    passwordHash: await bcrypt.hash(password, 12),
    firstName,
    lastName,
    isAdmin: false,
  });
  return startSession(email, password);
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}
