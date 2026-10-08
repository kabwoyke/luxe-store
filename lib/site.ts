export const SITE_NAME = "LUXESTORE";
export const SITE_TAGLINE = "Your everyday luxury, curated for you.";
export const SITE_DESCRIPTION =
  "Shop wigs, shoes, handbags, beauty and self-care online in Kenya. Delivery across Kenya and fast M-Pesa checkout.";

/** Public address of the site, used for canonical links, the sitemap and social previews. */
export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.AUTH_URL?.trim() || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

/** Digits only, for wa.me links. */
export function whatsappLink(number: string): string | null {
  const digits = number.replace(/\D/g, "");
  if (digits.length < 9) return null;
  const international = digits.startsWith("0") ? `254${digits.slice(1)}` : digits;
  return `https://wa.me/${international}`;
}
