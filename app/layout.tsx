import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { CartDrawerProvider } from "@/components/cart/cart-drawer-provider";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Toaster } from "sonner";
import { getSettings } from "@/lib/settings";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LUXESTORE | Beauty, Fashion & Wellness in Kenya",
  description: "Your everyday luxury, curated for you.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { freeDeliveryThreshold } = await getSettings();

  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} antialiased`}
    >
      <body className="flex min-h-screen flex-col">
        <CartDrawerProvider freeDeliveryThreshold={freeDeliveryThreshold}>
          <AnnouncementBar freeDeliveryThreshold={freeDeliveryThreshold} />
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <Toaster position="top-center" />
        </CartDrawerProvider>
      </body>
    </html>
  );
}
