import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, List, Section } from "@/components/content/content-page";

export const metadata: Metadata = {
  title: "About us",
  description: "LUXESTORE is a Kenyan online store for wigs, shoes, handbags, beauty and self-care, delivered across Kenya and paid for with M-Pesa.",
};

export default function AboutPage() {
  return (
    <ContentPage
      eyebrow="About LUXESTORE"
      title="Your everyday luxury, curated for you."
      intro="We are a Kenyan online store for beauty, fashion and wellness: the pieces that make an ordinary day feel a little more special."
    >
      <Section title="What we do">
        <p>
          LUXESTORE brings together wigs and hair, shoes and heels, handbags and totes, jewelry and accessories, beauty
          and makeup, and self-care essentials in one place. Everything is chosen because it looks good, feels good and
          is worth the money.
        </p>
        <p>
          You shop from your phone or computer, pay with M-Pesa, and we deliver to your door anywhere in Kenya.
        </p>
      </Section>

      <Section title="How we choose what we sell">
        <List>
          <li>
            <strong className="text-ink">Honest details.</strong> Each product lists its real colours, sizes and
            specifications, so you know what you are getting before you pay.
          </li>
          <li>
            <strong className="text-ink">Options that are really in stock.</strong> Sizes and colours that are sold out
            are marked, not hidden.
          </li>
          <li>
            <strong className="text-ink">Fair prices in shillings.</strong> Every price is in Kenyan shillings, and the
            total you see is the total you pay.
          </li>
        </List>
      </Section>

      <Section title="Paying and delivery">
        <p>
          Checkout uses M-Pesa: you enter your number, approve the prompt on your phone with your PIN, and your order is
          confirmed straight away. Delivery is free on bigger orders. See our{" "}
          <Link href="/shipping" className="font-semibold text-mauve hover:text-mauve-dark">
            delivery information
          </Link>{" "}
          and{" "}
          <Link href="/returns" className="font-semibold text-mauve hover:text-mauve-dark">
            returns policy
          </Link>{" "}
          for the details.
        </p>
      </Section>

      <Section title="Talk to us">
        <p>
          Questions about a product, an order or a delivery? We would love to hear from you on our{" "}
          <Link href="/contact" className="font-semibold text-mauve hover:text-mauve-dark">
            contact page
          </Link>
          .
        </p>
      </Section>
    </ContentPage>
  );
}
