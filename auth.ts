import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { authConfig } from "./auth.config";
import { loginSchema } from "@/lib/schemas/auth";

// Hash compared when the email is unknown, so unknown and wrong-password logins take similar time.
const DUMMY_HASH = "$2b$12$7kFkw03WmIzjqZX6G0vV5.AF6f9ZJkZPc07vr06EKOeD9EyONrhqG";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const [user] = await db.select().from(users).where(eq(users.email, email));
        const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
        if (!user || !valid) return null;

        return {
          id: String(user.id),
          email: user.email,
          name: `${user.firstName} ${user.lastName}`.trim(),
          isAdmin: user.isAdmin,
        };
      },
    }),
  ],
});
