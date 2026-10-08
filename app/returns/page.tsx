import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, List, Section } from "@/components/content/content-page";

export const metadata: Metadata = {
  title: "Returns and refunds",
  description: "Our returns policy: 7 days to return unused items, what cannot be returned for hygiene reasons, and how refunds are paid back to M-Pesa.",
};

export default function ReturnsPage() {
  return (
    <ContentPage
      eyebrow="Returns"
      title="Returns and refunds"
      intro="If something is not right, we will make it right. Here is how returns work."
      updated="October 2026"
    >
      <Section title="If your item is faulty, damaged or not what you ordered">
        <p>
          Contact us within 48 hours of delivery with your order number and a photo of the problem. We will replace the
          item or refund you in full, and we cover the return delivery cost.
        </p>
      </Section>

      <Section title="If you simply changed your mind">
        <p>You can return most items within 7 days of delivery if they are:</p>
        <List>
          <li>unused, unworn and in the same condition you received them;</li>
          <li>in the original packaging, with tags and any protective covers still attached;</li>
          <li>accompanied by your order number.</li>
        </List>
        <p>For these returns you pay the cost of sending the item back to us.</p>
      </Section>

      <Section title="What cannot be returned">
        <p>For hygiene and safety reasons we cannot take back:</p>
        <List>
          <li>wigs, hair bundles and hair pieces that have been worn, styled, cut, coloured, washed or have had the lace trimmed or the hairline plucked;</li>
          <li>opened or used makeup, skincare, fragrance, body care, bath and aromatherapy products, unless they arrived faulty;</li>
          <li>earrings and other pierced jewelry, and items sold as final sale;</li>
          <li>anything damaged after delivery.</li>
        </List>
        <p>Trying on a wig for fit is fine as long as it stays clean, unaltered and returned with its tags and cap.</p>
      </Section>

      <Section title="How to start a return">
        <ol className="list-decimal space-y-1.5 pl-5 marker:text-mauve">
          <li>
            <Link href="/contact" className="font-semibold text-mauve hover:text-mauve-dark">
              Contact us
            </Link>{" "}
            with your order number and what you would like to return.
          </li>
          <li>We confirm whether the item qualifies and tell you where to send it.</li>
          <li>Pack it securely and send it back. Keep your proof of dispatch.</li>
          <li>We check the item when it arrives and confirm your refund or exchange.</li>
        </ol>
      </Section>

      <Section title="Refunds">
        <p>
          Approved refunds are paid back to the M-Pesa number used for the order, usually within 3 to 5 working days of
          us receiving and checking the item. The original delivery fee is refunded only when the return is for a faulty
          or wrong item.
        </p>
        <p>
          If an item sells out at the moment you pay, we will contact you to offer a replacement or a full refund.
        </p>
      </Section>

      <Section title="Your legal rights">
        <p>
          Nothing in this policy limits your rights under Kenyan consumer protection law, including your right to goods
          that are of acceptable quality and as described.
        </p>
      </Section>
    </ContentPage>
  );
}
