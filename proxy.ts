import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

/**
 * Optimistic route protection: a fast check on the session cookie so signed-out visitors are
 * redirected and non-admins get a 404 before any page renders.
 * It is not the security boundary. Pages, route handlers and actions re-check against the database
 * (see lib/session.ts).
 */
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  const user = req.auth?.user;

  if (!user) {
    const login = new URL("/login", req.nextUrl);
    login.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(login);
  }

  if (pathname.startsWith("/admin") && !user.isAdmin) {
    return NextResponse.rewrite(new URL("/404", req.nextUrl));
  }
});

export const config = {
  matcher: ["/profile/:path*", "/checkout/:path*", "/order/:path*", "/admin/:path*"],
};
