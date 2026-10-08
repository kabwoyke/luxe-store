import { Suspense } from "react";
import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { PageContainer, PageHeader } from "@/components/shop/page-header";
import { requireUser } from "@/lib/session";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Checkout | LUXESTORE" };

export default function CheckoutPage() {
  return (
    <PageContainer>
      <PageHeader eyebrow="Secure checkout" title="Checkout" />
      <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-blush" />}>
        <Checkout />
      </Suspense>
    </PageContainer>
  );
}

async function Checkout() {
  const user = await requireUser("/checkout");
  const rules = await getSettings();
  return <CheckoutForm defaultName={`${user.firstName} ${user.lastName}`.trim()} defaultPhone="" rules={rules} />;
}
