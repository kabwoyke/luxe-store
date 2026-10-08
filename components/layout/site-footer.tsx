import Link from "next/link";
import { COMPANY_LINKS, NAV_LINKS, POLICY_LINKS } from "@/lib/nav";
import { getSettings } from "@/lib/settings";
import { Logo } from "./logo";
import { NewsletterForm } from "./newsletter-form";

export async function SiteFooter() {
  const { supportEmail, supportPhone } = await getSettings();

  return (
    <footer className="mt-16 bg-ink text-white/80">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo onDark />
          <p className="text-sm leading-relaxed text-white/70">
            Your everyday luxury, curated for you. Beauty, fashion and wellness,
            delivered across Kenya.
          </p>
          <p className="micro-label text-pink-200">
            Beauty • Fashion • Wellness
          </p>
          {(supportEmail || supportPhone) && (
            <ul className="space-y-1 text-sm">
              {supportEmail && (
                <li>
                  <a href={`mailto:${supportEmail}`} className="hover:text-white">
                    {supportEmail}
                  </a>
                </li>
              )}
              {supportPhone && (
                <li>
                  <a href={`tel:${supportPhone.replace(/\s/g, "")}`} className="hover:text-white">
                    {supportPhone}
                  </a>
                </li>
              )}
            </ul>
          )}
        </div>

        <FooterColumn title="Shop" links={NAV_LINKS.slice(1)} />
        <FooterColumn title="Help" links={[...COMPANY_LINKS, ...POLICY_LINKS]} />

        <div className="space-y-4">
          <h2 className="micro-label text-white">Join the list</h2>
          <p className="text-sm text-white/70">
            New arrivals and offers, straight to your inbox.
          </p>
          <NewsletterForm />
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-white/60">
        © LUXESTORE. All rights reserved.
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { label: string; href: string }[];
}) {
  return (
    <nav aria-label={title} className="space-y-4">
      <h2 className="micro-label text-white">{title}</h2>
      <ul className="space-y-2.5 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} prefetch={false} className="inline-block py-0.5 transition-colors hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
