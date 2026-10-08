import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/content/content-page";
import { JsonLd } from "@/components/seo/json-ld";
import { formatKES } from "@/lib/format";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description: "Answers about paying with M-Pesa, delivery across Kenya, returns, wigs and your LUXESTORE account.",
};

type Faq = { q: string; a: string; link?: { href: string; label: string } };

export default async function FaqPage() {
  const { deliveryFee, freeDeliveryThreshold } = await getSettings();

  const groups: { title: string; items: Faq[] }[] = [
    {
      title: "Ordering and paying",
      items: [
        {
          q: "How do I pay?",
          a: "We accept M-Pesa. At checkout, enter your Safaricom number and tap Pay. A prompt appears on your phone, you enter your M-Pesa PIN, and your order is confirmed. We never see your PIN.",
        },
        {
          q: "The M-Pesa prompt did not appear. What now?",
          a: "Check that your phone has network and that the number is a registered M-Pesa line. On your order page you can resend the prompt or try a different number. If you were charged but the order still shows as waiting, give it a minute and use \"Check payment status\"; if it does not update, contact us with your M-Pesa message.",
        },
        {
          q: "Can I pay with a card?",
          a: "Not yet. Card payments are coming soon. For now, M-Pesa is the way to pay.",
        },
        {
          q: "Can I use a different number to pay than the one for delivery?",
          a: "Yes. At checkout there is a separate M-Pesa number field, so a friend or family member can pay for you.",
        },
        {
          q: "Do I get a receipt?",
          a: "Yes. Once your payment is confirmed, a PDF receipt downloads automatically, and you can download it again from your order page.",
        },
        {
          q: "Can I change or cancel my order?",
          a: "Contact us as soon as possible. If the order has not been shipped, we can usually change or cancel it, and cancelled paid orders are refunded to M-Pesa.",
          link: { href: "/contact", label: "Contact us" },
        },
      ],
    },
    {
      title: "Delivery",
      items: [
        {
          q: "Do you deliver outside Nairobi?",
          a: "Yes, to all 47 counties. Nairobi usually takes 1 to 2 working days; other towns take a little longer.",
          link: { href: "/shipping", label: "Delivery details" },
        },
        {
          q: "How much is delivery?",
          a: `Delivery is free on orders of ${formatKES(freeDeliveryThreshold)} and above. Below that it is a flat ${formatKES(deliveryFee)}.`,
        },
        {
          q: "How do I follow my order?",
          a: "Log in and open your order from your account to see its status: pending, paid, shipped or delivered. Our rider or courier also calls you before delivery.",
          link: { href: "/profile", label: "Your account" },
        },
      ],
    },
    {
      title: "Products",
      items: [
        {
          q: "How do I choose a wig length?",
          a: "Wig lengths are measured in inches. Shorter lengths (10 to 14 inches) sit around the chin to shoulders, mid lengths (16 to 20) fall past the shoulders, and longer lengths (22 and above) reach the back or waist. Each product page lists the lengths available.",
        },
        {
          q: "What is the difference between human hair, semi-human and synthetic?",
          a: "Human hair wigs are made from real hair and can be styled with heat and coloured. Semi-human blends human and synthetic fibre for a lower price. Synthetic wigs are lightweight and hold their style, but are not for high heat unless the product says heat-friendly.",
        },
        {
          q: "Will the colour match the photo exactly?",
          a: "We show each colour as accurately as we can, but screens vary a little. Pick the colour swatch on the product page to see the photos for that colour.",
        },
        {
          q: "What does \"Only a few left\" mean?",
          a: "It means that colour and size is nearly sold out. Once it is gone it is marked as sold out until we restock.",
        },
      ],
    },
    {
      title: "Returns and your account",
      items: [
        {
          q: "Can I return something?",
          a: "Yes, within 7 days if it is unused and in its original packaging. For hygiene reasons some items, such as worn wigs and opened beauty products, cannot be returned.",
          link: { href: "/returns", label: "Returns policy" },
        },
        {
          q: "Do I need an account to order?",
          a: "Yes. An account lets you check out quickly, see your order history and download receipts. Signing up takes under a minute.",
          link: { href: "/signup", label: "Create an account" },
        },
        {
          q: "How is my personal information used?",
          a: "Only to process your orders and answer your questions. We never sell your details.",
          link: { href: "/privacy", label: "Privacy policy" },
        },
      ],
    },
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: groups.flatMap((g) =>
      g.items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } }))
    ),
  };

  return (
    <ContentPage eyebrow="Help" title="Frequently asked questions" intro="Quick answers to the things people ask us most.">
      <JsonLd data={faqJsonLd} />
      {groups.map((group) => (
        <section key={group.title} aria-labelledby={`faq-${group.title}`} className="space-y-3">
          <h2 id={`faq-${group.title}`} className="text-xl font-bold sm:text-2xl">
            {group.title}
          </h2>
          <div className="divide-y divide-border rounded-3xl border border-border bg-white">
            {group.items.map((item) => (
              <details key={item.q} className="group px-5 py-1">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-2 font-heading font-semibold text-ink [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span aria-hidden className="text-xl leading-none text-mauve transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <div className="pb-4 leading-relaxed text-body">
                  <p>{item.a}</p>
                  {item.link && (
                    <p className="mt-2">
                      <Link href={item.link.href} className="font-semibold text-mauve hover:text-mauve-dark">
                        {item.link.label}
                      </Link>
                    </p>
                  )}
                </div>
              </details>
            ))}
          </div>
        </section>
      ))}
      <p className="text-body">
        Still stuck?{" "}
        <Link href="/contact" className="font-semibold text-mauve hover:text-mauve-dark">
          Send us a message
        </Link>
        .
      </p>
    </ContentPage>
  );
}
