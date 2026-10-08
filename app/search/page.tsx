import { Suspense } from "react";
import type { Metadata } from "next";
import { getAllProducts } from "@/lib/catalog";
import { toCardProduct } from "@/lib/card-product";
import { textMatchesQuery } from "@/lib/product-options";
import { GridSkeleton } from "@/components/shop/grid-skeleton";
import { PageContainer, PageHeader } from "@/components/shop/page-header";
import { ProductBrowser } from "@/components/shop/product-browser";

export const metadata: Metadata = { title: "Search", robots: { index: false, follow: false } };

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <PageContainer>
      <Suspense fallback={<GridSkeleton />}>
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </PageContainer>
  );
}

async function SearchResults({ searchParams }: Pick<PageProps<"/search">, "searchParams">) {
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";

  if (!q) {
    return (
      <PageHeader
        title="Search"
        description="Type something in the search box: a product, colour, hair texture, brand or material."
      />
    );
  }

  const products = (await getAllProducts())
    .map(toCardProduct)
    .filter((p) => textMatchesQuery(p.searchText, q));

  return (
    <>
      <PageHeader eyebrow="Search results" title={`“${q}”`} />
      <ProductBrowser products={products} emptyMessage={`No products found for “${q}”.`} />
    </>
  );
}
