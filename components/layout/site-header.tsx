import { Suspense } from "react";
import Link from "next/link";
import { NAV_LINKS } from "@/lib/nav";
import { Logo } from "./logo";
import { SearchForm } from "./search-form";
import { MobileMenu } from "./mobile-menu";
import { HeaderActions } from "./header-actions";
import { ActiveNavLink } from "./active-nav-link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-page">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 xl:gap-8">
        <Logo />
        <SearchForm className="hidden flex-1 xl:block" />
        <div className="ml-auto flex items-center gap-1 xl:ml-0">
          <HeaderActions />
          <MobileMenu />
        </div>
      </div>
      <nav
        aria-label="Main"
        className="no-scrollbar hidden overflow-x-auto border-t border-border xl:block"
      >
        <ul className="mx-auto flex w-max min-w-full items-center justify-center gap-x-8 px-6 py-3">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              {/* usePathname is dynamic on dynamic routes, so it needs a boundary. */}
              <Suspense
                fallback={
                  <Link
                    href={link.href}
                    className="whitespace-nowrap text-sm font-medium text-body"
                  >
                    {link.label}
                  </Link>
                }
              >
                <ActiveNavLink href={link.href}>{link.label}</ActiveNavLink>
              </Suspense>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
