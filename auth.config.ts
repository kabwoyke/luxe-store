import type { NextAuthConfig } from "next-auth";

/** Edge-safe part of the Auth.js config, shared by auth.ts and proxy.ts (no database imports here). */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.isAdmin = user.isAdmin ?? false;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.uid as string;
      session.user.isAdmin = Boolean(token.isAdmin);
      return session;
    },
  },
} satisfies NextAuthConfig;
