import type { NextConfig } from "next";

/*
 * Security headers. A full script-src Content-Security-Policy needs per-request nonces and is not
 * set here; this CSP covers framing, plugins, <base> and form targets, which need no nonce.
 */
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Money and admin data must never be cached by a browser, proxy or CDN.
      { source: "/api/(admin|mpesa|orders)/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  // Modern formats first: much smaller photos on browsers that support them.
  images: { formats: ["image/avif", "image/webp"] },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
