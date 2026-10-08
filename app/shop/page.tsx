import { Suspense } from "react";
import type { Metadata } from "next";
import { getAllProducts } from "@/lib/catalog";
import { toCardProduct } from "@/lib/card-product";
import { GridSkeleton } from "@/components/shop/grid-skeleton";
import { PageContainer, PageHeader } from "@/components/shop/page-header";
import { ProductBrowser } from "@/components/shop/product-browser";

export const metadata: Metadata = { title: "Shop | LUXESTORE" };

export default function ShopPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Beauty • Fashion • Wellness"
        title="Shop all"
        description="Wigs, shoes, handbags, beauty and more, delivered across Kenya."
      />
      <Suspense fallback={<GridSkeleton />}>
        <ShopProducts />
      </Suspense>
    </PageContainer>
  );
}

async function ShopProducts() {
  const products = (await getAllProducts()).map(toCardProduct);
  return <ProductBrowser products={products} searchable emptyMessage="No products match your search." />;
}
