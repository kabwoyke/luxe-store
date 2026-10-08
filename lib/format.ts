const kes = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  maximumFractionDigits: 0,
});

/** Money is stored as integer KES. */
export function formatKES(amount: number): string {
  return kes.format(amount);
}
