import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";

/**
 * Data access layer for sessions. The signed cookie only says who the user is; whether they
 * still exist and whether they are an admin is always read from the database.
 */
export type CurrentUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  const id = Number(session?.user?.id);
  if (!Number.isInteger(id)) return null;

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      isAdmin: users.isAdmin,
    })
    .from(users)
    .where(eq(users.id, id));
  return user ?? null;
}

/** For pages: signed-out visitors go to the login page and come back afterwards. */
export async function requireUser(callbackUrl: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  return user;
}

/** For route handlers: returns a Response to send back when the check fails. */
export async function requireApiUser(): Promise<CurrentUser | Response> {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Please sign in." }, { status: 401 });
  return user;
}

export async function requireApiAdmin(): Promise<CurrentUser | Response> {
  const user = await requireApiUser();
  if (user instanceof Response) return user;
  if (!user.isAdmin) return Response.json({ error: "Not allowed." }, { status: 403 });
  return user;
}

/** Only follow callback URLs that stay on this site. */
export function safeCallbackUrl(value: string | null | undefined): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/profile";
}
