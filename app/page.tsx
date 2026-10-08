import Link from "next/link";
import { ArrowRight, Footprints, Flower2, Gem, ShoppingBag, Sparkles, Wand2 } from "lucide-react";
import { getAllProducts, getCollections } from "@/lib/catalog";
import { toCardProduct } from "@/lib/card-product";
import { CATEGORIES } from "@/lib/product-options";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { ProductCard } from "@/components/shop/product-card";
import { NewsletterForm } from "@/components/layout/newsletter-form";

const TILES = [
  { key: "Wigs", icon: Sparkles },
  { key: "Cosmetics", icon: Wand2 },
  { key: "Shoes", icon: Footprints },
  { key: "Handbags", icon: ShoppingBag },
  { key: "Accessories", icon: Gem },
  { key: "Wellness", icon: Flower2 },
] as const;

export default async function Home() {
  const [all, collections] = await Promise.all([getAllProducts(), getCollections()]);
  const cards = all.map(toCardProduct);
  const newArrivals = cards.filter((p) => p.newArrival).slice(0, 4);
  const bestSellers = cards.filter((p) => p.bestSeller).slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl space-y-14 px-4 py-6 sm:space-y-20 sm:px-6">
      <HeroCarousel />

      <section aria-labelledby="shop-by-category">
        <SectionHeading id="shop-by-category" title="Shop by category" />
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {TILES.map(({ key, icon: Icon }) => (
            <li key={key}>
              <Link
                href={`/categories/${key}`}
                className="flex h-full flex-col items-center gap-3 rounded-[1.25rem] border border-border bg-white px-3 py-6 text-center shadow-[0_16px_40px_rgba(53,25,41,0.06)] transition-colors hover:border-mauve sm:rounded-[1.6rem]"
              >
                <span className="grid size-12 place-items-center rounded-full bg-blush text-mauve">
                  <Icon className="size-5" />
                </span>
                <span className="font-heading text-sm font-semibold text-ink">{CATEGORIES[key].label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <ProductSection id="new-arrivals" title="New arrivals" href="/collections/new-arrivals" products={newArrivals} />
      <ProductSection id="best-sellers" title="Best sellers" href="/shop" products={bestSellers} />

      {collections.length > 0 && (
        <section aria-labelledby="collections">
          <SectionHeading id="collections" title="Collections" />
          <ul className="grid gap-3 sm:grid-cols-2">
            {collections.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/collections/${c.slug}`}
                  className="group flex h-full flex-col justify-between gap-6 rounded-3xl bg-blush p-6 transition-colors hover:bg-pink-100 sm:p-8"
                >
                  <div>
                    <h3 className="text-xl font-bold">{c.name}</h3>
                    <p className="mt-1 text-sm text-body">{c.description}</p>
                  </div>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-mauve group-hover:text-mauve-dark">
                    Explore <ArrowRight className="size-4" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-3xl border border-border bg-white px-6 py-10 text-center sm:px-12 sm:py-14">
        <h2 className="text-2xl font-bold sm:text-3xl">Join the LUXESTORE list</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-body">
          New arrivals, offers and beauty tips, straight to your inbox.
        </p>
        <div className="mx-auto mt-6 max-w-md text-left">
          <NewsletterForm tone="light" />
        </div>
      </section>
    </div>
  );
}

function SectionHeading({ id, title, href }: { id: string; title: string; href?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <h2 id={id} className="text-2xl font-bold tracking-tight sm:text-3xl">
        {title}
      </h2>
      {href && (
        <Link href={href} className="shrink-0 text-sm font-semibold text-mauve hover:text-mauve-dark">
          View all
        </Link>
      )}
    </div>
  );
}

function ProductSection({
  id,
  title,
  href,
  products,
}: {
  id: string;
  title: string;
  href: string;
  products: ReturnType<typeof toCardProduct>[];
}) {
  if (products.length === 0) return null;
  return (
    <section aria-labelledby={id}>
      <SectionHeading id={id} title={title} href={href} />
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {products.map((p) => (
          <li key={p.id} className="min-w-0">
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}
