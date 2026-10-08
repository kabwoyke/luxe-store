import type { Settings } from "@/lib/schemas/settings";

/** Delivery rule from the store settings: free at or over the threshold, otherwise a flat fee. Integer KES. */
export function deliveryFeeFor(subtotal: number, rules: Pick<Settings, "deliveryFee" | "freeDeliveryThreshold">): number {
  return subtotal >= rules.freeDeliveryThreshold ? 0 : rules.deliveryFee;
}

/** "KES 5,000", for sentences. */
export function kesLabel(amount: number): string {
  return `KES ${amount.toLocaleString("en-KE")}`;
}
