import type { Metadata } from "next";
import { getAllProducts } from "@/lib/catalog";
import { toCardProduct } from "@/lib/card-product";
import { PageContainer, PageHeader } from "@/components/shop/page-header";
import { WishlistView } from "@/components/shop/wishlist-view";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false, follow: false } };

export default async function WishlistPage() {
  const products = (await getAllProducts()).map(toCardProduct);

  return (
    <PageContainer>
      <PageHeader title="Your wishlist" description="Pieces you have saved on this device." />
      <WishlistView products={products} />
    </PageContainer>
  );
}
