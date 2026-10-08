import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { CartDrawerProvider } from "@/components/cart/cart-drawer-provider";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { LazyToaster } from "@/components/layout/lazy-toaster";
import { getSettings } from "@/lib/settings";
import { SITE_DESCRIPTION, SITE_NAME, siteUrl } from "@/lib/site";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"] });

const DEFAULT_TITLE = `${SITE_NAME} | Beauty, Fashion & Wellness in Kenya`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: DEFAULT_TITLE, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "./" },
  openGraph: { type: "website", siteName: SITE_NAME, locale: "en_KE" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#2d1a2d",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { freeDeliveryThreshold } = await getSettings();

  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} antialiased`}
    >
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
        <CartDrawerProvider freeDeliveryThreshold={freeDeliveryThreshold}>
          <AnnouncementBar freeDeliveryThreshold={freeDeliveryThreshold} />
          <SiteHeader />
          <main id="main" tabIndex={-1} className="flex-1 outline-none">
            {children}
          </main>
          <Suspense fallback={null}>
            <SiteFooter />
          </Suspense>
          <LazyToaster />
        </CartDrawerProvider>
      </body>
    </html>
  );
}
