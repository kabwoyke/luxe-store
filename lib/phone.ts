/**
 * Normalises a Kenyan mobile number to 2547XXXXXXXX / 2541XXXXXXXX (the format Daraja expects).
 * Accepts 07…, 01…, +254… and 254…; returns null for anything else.
 */
export function normalizePhone(input: string): string | null {
  const digits = input.trim().replace(/[\s()-]/g, "").replace(/^\+/, "");
  const local = /^0([17]\d{8})$/.exec(digits) ?? /^254([17]\d{8})$/.exec(digits);
  return local ? `254${local[1]}` : null;
}
