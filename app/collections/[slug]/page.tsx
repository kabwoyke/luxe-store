import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getAllProducts, getCollectionBySlug, getProductsForCollection } from "@/lib/catalog";
import { toCardProduct } from "@/lib/card-product";
import { GridSkeleton } from "@/components/shop/grid-skeleton";
import { PageContainer, PageHeader } from "@/components/shop/page-header";
import { ProductBrowser } from "@/components/shop/product-browser";

export default function CollectionPage({ params }: PageProps<"/collections/[slug]">) {
  return (
    <PageContainer>
      <Suspense fallback={<GridSkeleton />}>
        <CollectionProducts params={params} />
      </Suspense>
    </PageContainer>
  );
}

async function CollectionProducts({ params }: Pick<PageProps<"/collections/[slug]">, "params">) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound();

  // "New arrivals" follows the New arrival flag on products, so new items appear without editing the collection.
  const members =
    slug === "new-arrivals"
      ? (await getAllProducts()).filter((p) => p.newArrival)
      : await getProductsForCollection(collection.productIds);
  const products = members.map(toCardProduct);

  return (
    <>
      <PageHeader eyebrow="Collection" title={collection.name} description={collection.description} />
      <ProductBrowser products={products} emptyMessage="This collection is empty for now." />
    </>
  );
}
