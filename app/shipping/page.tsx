import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, List, Section } from "@/components/content/content-page";
import { formatKES } from "@/lib/format";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Delivery information",
  description: "Delivery across Kenya: costs, free delivery threshold, how long it takes and what to expect when your order arrives.",
};

export default async function ShippingPage() {
  const { deliveryFee, freeDeliveryThreshold } = await getSettings();

  return (
    <ContentPage
      eyebrow="Delivery"
      title="Delivery across Kenya"
      intro={`We deliver to all 47 counties. Orders of ${formatKES(freeDeliveryThreshold)} and above ship free.`}
      updated="October 2026"
    >
      <Section title="What delivery costs">
        <List>
          <li>
            <strong className="text-ink">Orders of {formatKES(freeDeliveryThreshold)} or more:</strong> free delivery.
          </li>
          <li>
            <strong className="text-ink">Orders below {formatKES(freeDeliveryThreshold)}:</strong> a flat delivery fee
            of {formatKES(deliveryFee)}.
          </li>
        </List>
        <p>The delivery fee is shown in your cart summary at checkout before you pay, so there are no surprises.</p>
      </Section>

      <Section title="How long it takes">
        <p>Delivery starts once your M-Pesa payment is confirmed. Typical times after that:</p>
        <List>
          <li>Nairobi and surrounding areas: 1 to 2 working days.</li>
          <li>Other major towns (Mombasa, Kisumu, Nakuru, Eldoret and similar): 2 to 4 working days.</li>
          <li>Other areas: 3 to 7 working days.</li>
        </List>
        <p>
          Orders placed on weekends or public holidays are processed on the next working day. A busy period such as
          Christmas or a sale may add a day or two.
        </p>
      </Section>

      <Section title="Placing your order">
        <List>
          <li>Give a phone number that is reachable on the day. Our rider or courier will call before delivery.</li>
          <li>Include your estate, street, building and a landmark in the address. It helps a lot outside Nairobi.</li>
          <li>
            Payment is by M-Pesa only, before dispatch. We do not offer pay on delivery.
          </li>
        </List>
      </Section>

      <Section title="When your parcel arrives">
        <p>
          Please check the parcel while the rider is with you. If something looks wrong, such as a damaged package or
          the wrong item, tell the rider and contact us the same day so we can put it right. If nobody is available to
          receive the parcel, we will call to arrange a second delivery.
        </p>
      </Section>

      <Section title="Where we do not deliver">
        <p>We deliver within Kenya only. International orders are not available at the moment.</p>
      </Section>

      <Section title="Questions?">
        <p>
          See the{" "}
          <Link href="/faq" className="font-semibold text-mauve hover:text-mauve-dark">
            FAQ
          </Link>{" "}
          or{" "}
          <Link href="/contact" className="font-semibold text-mauve hover:text-mauve-dark">
            contact us
          </Link>
          . Have an order already? Open it from your{" "}
          <Link href="/profile" className="font-semibold text-mauve hover:text-mauve-dark">
            account
          </Link>{" "}
          to see its status.
        </p>
      </Section>
    </ContentPage>
  );
}
