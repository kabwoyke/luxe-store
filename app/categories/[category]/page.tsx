import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getAllProducts } from "@/lib/catalog";
import { toCardProduct } from "@/lib/card-product";
import { CATEGORY_KEYS, CATEGORIES } from "@/lib/product-options";
import { GridSkeleton } from "@/components/shop/grid-skeleton";
import { PageContainer } from "@/components/shop/page-header";
import { ProductBrowser } from "@/components/shop/product-browser";

export default function CategoryPage({ params }: PageProps<"/categories/[category]">) {
  return (
    <PageContainer>
      <Suspense fallback={<GridSkeleton />}>
        <CategoryProducts params={params} />
      </Suspense>
    </PageContainer>
  );
}

async function CategoryProducts({ params }: Pick<PageProps<"/categories/[category]">, "params">) {
  const { category } = await params;
  // URLs use the config key ("Wigs"), but accept any letter case.
  const key = CATEGORY_KEYS.find((k) => k.toLowerCase() === decodeURIComponent(category).toLowerCase());
  if (!key) notFound();

  const cfg = CATEGORIES[key];
  const products = (await getAllProducts()).filter((p) => p.category === key).map(toCardProduct);

  return (
    <>
      <div className="mb-6 sm:mb-8">
        <p className="micro-label text-mauve">Category</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{cfg.label}</h1>
        <p className="mt-2 text-sm text-body sm:text-base">{cfg.types.filter((t) => t !== "General").join(" • ")}</p>
      </div>
      <ProductBrowser products={products} emptyMessage="Nothing here yet. New pieces are on the way." />
    </>
  );
}
