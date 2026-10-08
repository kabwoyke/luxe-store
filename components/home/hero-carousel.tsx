"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { ProductImage } from "@/components/shop/product-image";
import { cn } from "@/lib/utils";

type Slide = {
  eyebrow: string;
  title: string;
  highlight: string;
  text: string;
  cta: { label: string; href: string };
  image: string;
  alt: string;
};

const SLIDES: Slide[] = [
  {
    eyebrow: "Beauty • Fashion • Wellness",
    title: "Your everyday luxury,",
    highlight: "curated for you.",
    text: "Wigs, shoes, handbags and self-care, delivered across Kenya. Pay easily with M-Pesa.",
    cta: { label: "Shop now", href: "/shop" },
    image: "/products/kinky-curly-u-part-wig.jpg",
    alt: "Woman with defined dark curls",
  },
  {
    eyebrow: "Hair & Wigs",
    title: "Hair that looks",
    highlight: "like yours.",
    text: "Lace fronts, closures and glueless wigs in every texture and length.",
    cta: { label: "Shop wigs", href: "/categories/Wigs" },
    image: "/products/glueless-straight-wig.jpg",
    alt: "Woman with long straight hair",
  },
  {
    eyebrow: "Shoes & Heels",
    title: "Step out in",
    highlight: "comfort.",
    text: "Block heels, sneakers and sandals for every kind of day.",
    cta: { label: "Shop shoes", href: "/categories/Shoes" },
    image: "/products/block-heel-sandals.jpg",
    alt: "White block heel sandals",
  },
  {
    eyebrow: "Handbags & Totes",
    title: "Carry it",
    highlight: "beautifully.",
    text: "Leather totes and crossbody bags made to go everywhere with you.",
    cta: { label: "Shop handbags", href: "/categories/Handbags" },
    image: "/products/leather-tote.jpg",
    alt: "Brown leather tote bag",
  },
  {
    eyebrow: "New arrivals",
    title: "Fresh in",
    highlight: "this week.",
    text: "The latest pieces, before everyone else has them.",
    cta: { label: "See what's new", href: "/collections/new-arrivals" },
    image: "/products/bouncy-curl-bob-wig.jpg",
    alt: "Woman wearing a bright bob wig",
  },
];

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const getReducedMotion = () => window.matchMedia(REDUCED_MOTION).matches;
function subscribeReducedMotion(callback: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

const INTERVAL_MS = 5500;
const SWIPE_PX = 40;

export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false);
  const startX = useRef<number | null>(null);

  const go = (next: number) => setIndex((next + SLIDES.length) % SLIDES.length);

  const playing = !paused && !userPaused && !reducedMotion;

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [playing, index]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured collections"
      className="relative overflow-hidden rounded-3xl bg-linear-to-br from-ink via-[#4d2b45] to-mauve-dark text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onPointerDown={(e) => (startX.current = e.clientX)}
      onPointerUp={(e) => {
        if (startX.current === null) return;
        const delta = e.clientX - startX.current;
        startX.current = null;
        if (Math.abs(delta) >= SWIPE_PX) go(index + (delta < 0 ? 1 : -1));
      }}
    >
      <div className="relative min-h-[26rem] touch-pan-y sm:min-h-[30rem] lg:min-h-[34rem]">
        {SLIDES.map((slide, i) => {
          const active = i === index;
          const Heading = i === 0 ? "h1" : "h2";
          return (
            <div
              key={slide.cta.href}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${SLIDES.length}`}
              aria-hidden={!active}
              inert={!active}
              className={cn(
                "absolute inset-0 transition-opacity duration-700",
                active ? "opacity-100" : "pointer-events-none opacity-0"
              )}
            >
              {/* Photo: full-bleed under a dark wash on phones, right half on larger screens. */}
              <div className="absolute inset-0 md:left-1/2">
                <ProductImage
                  src={slide.image}
                  alt={slide.alt}
                  sizes="(min-width: 768px) 50vw, 100vw"
                  priority={i === 0}
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-ink/65 md:hidden" />
                <div className="absolute inset-0 hidden bg-linear-to-r from-[#4d2b45] via-[#4d2b45]/30 to-transparent md:block" />
              </div>

              <div className="relative flex h-full min-h-[inherit] flex-col justify-center px-6 py-14 pb-20 sm:px-12 md:w-1/2 lg:px-16">
                <p className="micro-label text-pink-200">{slide.eyebrow}</p>
                <Heading className="mt-4 max-w-xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                  {slide.title} <span className="text-pink-300">{slide.highlight}</span>
                </Heading>
                <p className="mt-4 max-w-md text-sm text-white/80 sm:text-base">{slide.text}</p>
                <div className="mt-8">
                  <Link
                    href={slide.cta.href}
                    className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-sm font-semibold text-ink transition-colors hover:bg-blush"
                  >
                    {slide.cta.label} <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute inset-x-0 bottom-4 flex items-center justify-between gap-3 px-4 sm:px-8">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => go(index - 1)}
            className="grid size-10 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/30"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => go(index + 1)}
            className="grid size-10 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/30"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        <div className="flex items-center" role="group" aria-label="Choose slide">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.cta.href}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index}
              onClick={() => go(i)}
              className="grid h-10 w-6 place-items-center"
            >
              <span className={cn("h-2 rounded-full bg-white/50 transition-all", i === index ? "w-6 bg-white" : "w-2")} />
            </button>
          ))}
        </div>

        <button
          type="button"
          aria-label={userPaused ? "Play slideshow" : "Pause slideshow"}
          onClick={() => setUserPaused((p) => !p)}
          className="grid size-10 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/30"
        >
          {userPaused ? <Play className="size-4" /> : <Pause className="size-4" />}
        </button>
      </div>
    </section>
  );
}
