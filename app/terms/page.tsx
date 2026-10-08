import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, List, Section } from "@/components/content/content-page";

export const metadata: Metadata = {
  title: "Terms and conditions",
  description: "The terms for shopping at LUXESTORE: orders, prices, M-Pesa payment, delivery, returns and your account.",
};

export default function TermsPage() {
  return (
    <ContentPage
      eyebrow="Terms"
      title="Terms and conditions"
      intro="By creating an account or placing an order on LUXESTORE you agree to these terms. Please read them."
      updated="October 2026"
    >
      <Section title="1. Using the shop">
        <p>
          You must be at least 18 to place an order. Keep your login details private and tell us if you think someone
          else has used your account. You are responsible for what happens under your account.
        </p>
      </Section>

      <Section title="2. Products and prices">
        <List>
          <li>All prices are in Kenyan shillings (KES).</li>
          <li>
            We take care to describe products and show their colours accurately, but screens differ and small variations
            can occur.
          </li>
          <li>
            Stock is limited. If we made a pricing or stock error, we may cancel the order and refund you in full.
          </li>
        </List>
      </Section>

      <Section title="3. Orders and payment">
        <List>
          <li>
            Placing an order is an offer to buy. We accept it when your M-Pesa payment is confirmed. You will see the
            status on your order page.
          </li>
          <li>Payment is by M-Pesa. You must use a number you are authorised to use.</li>
          <li>
            Your total is worked out by our system from the current price and delivery rules at the time you order.
          </li>
          <li>
            If you are charged but the order is not confirmed, or an item sells out as you pay, we will contact you and
            either fix the order or refund you.
          </li>
        </List>
      </Section>

      <Section title="4. Delivery">
        <p>
          We deliver within Kenya as described in our{" "}
          <Link href="/shipping" className="font-semibold text-mauve hover:text-mauve-dark">
            delivery information
          </Link>
          . Delivery times are estimates, not guarantees. Risk in the goods passes to you when they are delivered to the
          address you gave. Please make sure the address and phone number are correct.
        </p>
      </Section>

      <Section title="5. Returns and refunds">
        <p>
          Our{" "}
          <Link href="/returns" className="font-semibold text-mauve hover:text-mauve-dark">
            returns policy
          </Link>{" "}
          forms part of these terms. Your statutory rights as a consumer are not affected.
        </p>
      </Section>

      <Section title="6. Reviews and messages">
        <p>
          When you post a review you confirm it is honest and your own. We may remove reviews that are abusive,
          misleading or unlawful.
        </p>
      </Section>

      <Section title="7. Our content">
        <p>
          The LUXESTORE name, logo, photos, text and design belong to us or our licensors. You may not copy or reuse
          them without our written permission.
        </p>
      </Section>

      <Section title="8. Our responsibility">
        <p>
          We are responsible for goods that are faulty or not as described, as set out in our returns policy and by law.
          We are not liable for losses we could not reasonably have foreseen, or for delays caused by things outside our
          control, such as network outages, weather or courier disruption. Nothing in these terms excludes liability
          that cannot be excluded by law.
        </p>
      </Section>

      <Section title="9. Privacy">
        <p>
          How we handle your personal data is explained in our{" "}
          <Link href="/privacy" className="font-semibold text-mauve hover:text-mauve-dark">
            privacy policy
          </Link>
          .
        </p>
      </Section>

      <Section title="10. Changes and governing law">
        <p>
          We may update these terms from time to time; the version on this page when you order applies to that order.
          These terms are governed by the laws of Kenya, and the courts of Kenya have jurisdiction over any dispute.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions about these terms? Please{" "}
          <Link href="/contact" className="font-semibold text-mauve hover:text-mauve-dark">
            get in touch
          </Link>
          .
        </p>
      </Section>
    </ContentPage>
  );
}
