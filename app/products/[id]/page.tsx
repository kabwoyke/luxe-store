import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductById, getReviews } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { toDetailProduct } from "@/lib/detail-product";
import { CATEGORIES, defaultColor, specRows, variantColors } from "@/lib/product-options";
import { PageContainer } from "@/components/shop/page-header";
import { ProductView } from "@/components/product/product-view";
import { ProductTabs } from "@/components/product/product-tabs";
import { ReviewsPanel } from "@/components/product/reviews-panel";

export default function ProductPage({ params, searchParams }: PageProps<"/products/[id]">) {
  return (
    <PageContainer>
      <Suspense fallback={<ProductSkeleton />}>
        <ProductContent params={params} searchParams={searchParams} />
      </Suspense>
    </PageContainer>
  );
}

async function ProductContent({
  params,
  searchParams,
}: Pick<PageProps<"/products/[id]">, "params" | "searchParams">) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId) || productId <= 0) notFound();

  const row = await getProductById(productId);
  if (!row) notFound();

  const product = toDetailProduct(row);
  const requested = (await searchParams).color;
  const wanted = Array.isArray(requested) ? requested[0] : requested;
  // ?color= wins when it names a real colour; otherwise the first colour that is in stock.
  const initialColor = wanted && variantColors(product.variants).includes(wanted) ? wanted : defaultColor(product.variants);

  const reviews = await getReviews(productId);
  const { freeDeliveryThreshold } = await getSettings();
  const specs = specRows({ ...product, tags: product.tags });
  const category = CATEGORIES[product.category];

  return (
    <div className="space-y-12">
      <nav aria-label="Breadcrumb" className="text-xs text-muted-ink">
        <Link href="/" className="hover:text-mauve">
          Home
        </Link>{" "}
        /{" "}
        <Link href={`/categories/${product.category}`} className="hover:text-mauve">
          {category?.label ?? product.category}
        </Link>{" "}
        / <span className="text-ink">{product.name}</span>
      </nav>

      <ProductView product={product} initialColor={initialColor} freeDeliveryThreshold={freeDeliveryThreshold} />

      <ProductTabs
        tabs={[
          {
            id: "description",
            label: "Description",
            content: <p className="max-w-3xl leading-relaxed text-body">{product.description}</p>,
          },
          {
            id: "specs",
            label: "Specifications",
            content: (
              <dl className="max-w-2xl divide-y divide-border rounded-3xl border border-border bg-white">
                {specs.map((row) => (
                  <div key={row.label} className="grid grid-cols-[8rem_1fr] gap-4 px-5 py-3 text-sm sm:grid-cols-[12rem_1fr]">
                    <dt className="text-muted-ink">{row.label}</dt>
                    <dd className="font-medium text-ink">{row.value}</dd>
                  </div>
                ))}
              </dl>
            ),
          },
          {
            id: "reviews",
            label: `Reviews (${reviews.length})`,
            content: <ReviewsPanel productId={productId} reviews={reviews} />,
          },
        ]}
      />
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12" aria-hidden>
      <div className="aspect-square animate-pulse rounded-3xl bg-blush" />
      <div className="space-y-4">
        <div className="h-4 w-24 animate-pulse rounded-full bg-blush" />
        <div className="h-10 w-4/5 animate-pulse rounded-full bg-blush" />
        <div className="h-8 w-32 animate-pulse rounded-full bg-blush" />
        <div className="h-32 animate-pulse rounded-3xl bg-blush" />
      </div>
    </div>
  );
}
