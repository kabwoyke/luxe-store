import Link from "next/link";
import { COMPANY_LINKS, NAV_LINKS, POLICY_LINKS } from "@/lib/nav";
import { Logo } from "./logo";
import { NewsletterForm } from "./newsletter-form";

export function SiteFooter() {
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
        </div>

        <FooterColumn title="Shop" links={NAV_LINKS.slice(1)} />
        <FooterColumn title="Help" links={[...COMPANY_LINKS, ...POLICY_LINKS]} />

        <div className="space-y-4">
          <h3 className="micro-label text-white">Join the list</h3>
          <p className="text-sm text-white/70">
            New arrivals and offers, straight to your inbox.
          </p>
          <NewsletterForm />
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-white/50">
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
    <div className="space-y-4">
      <h3 className="micro-label text-white">{title}</h3>
      <ul className="space-y-2.5 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="transition-colors hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
