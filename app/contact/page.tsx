import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { ContactForm } from "@/components/content/contact-form";
import { ContentPage } from "@/components/content/content-page";
import { whatsappLink } from "@/lib/site";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Get in touch with LUXESTORE about an order, a product or a delivery. We usually reply within one working day.",
};

export default async function ContactPage() {
  const { supportEmail, supportPhone, whatsapp, businessAddress } = await getSettings();
  const chat = whatsapp ? whatsappLink(whatsapp) : null;

  const methods = [
    supportEmail && { icon: Mail, label: "Email", value: supportEmail, href: `mailto:${supportEmail}` },
    supportPhone && { icon: Phone, label: "Phone", value: supportPhone, href: `tel:${supportPhone.replace(/\s/g, "")}` },
    chat && { icon: MessageCircle, label: "WhatsApp", value: "Chat on WhatsApp", href: chat },
    businessAddress && { icon: MapPin, label: "Address", value: businessAddress },
  ].filter((m): m is { icon: typeof Mail; label: string; value: string; href?: string } => Boolean(m));

  return (
    <ContentPage
      eyebrow="Contact"
      title="We would love to hear from you"
      intro="Questions about an order, a product or a delivery? Send us a message and we will get back to you, usually within one working day."
    >
      {methods.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2" aria-label="Ways to reach us">
          {methods.map(({ icon: Icon, label, value, href }) => (
            <li key={label} className="flex items-start gap-3 rounded-3xl border border-border bg-white p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blush text-mauve">
                <Icon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="micro-label text-muted-ink">{label}</p>
                {href ? (
                  <a href={href} className="break-words font-semibold text-ink hover:text-mauve" {...(href.startsWith("http") ? { rel: "noopener noreferrer", target: "_blank" } : {})}>
                    {value}
                  </a>
                ) : (
                  <p className="font-semibold text-ink">{value}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <ContactForm />
    </ContentPage>
  );
}
