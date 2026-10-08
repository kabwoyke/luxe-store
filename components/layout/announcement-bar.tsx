import { kesLabel } from "@/lib/pricing";

export function AnnouncementBar({ freeDeliveryThreshold }: { freeDeliveryThreshold: number }) {
  const amount = kesLabel(freeDeliveryThreshold);
  return (
    <div className="bg-ink px-4 py-2 text-center text-[11px] text-white sm:text-xs">
      <span className="sm:hidden">
        Free delivery over {amount} | M-Pesa checkout
      </span>
      <span className="hidden sm:inline">
        Free Delivery across Kenya on orders over {amount} | Fast M-Pesa
        Checkout
      </span>
    </div>
  );
}
