"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/db/schema";
import { api, type Serialized } from "@/lib/admin-api";
import {
  CATEGORIES,
  CATEGORY_KEYS,
  colorCss,
  curlyFromTexture,
  findPresetColor,
  variantId,
  variantLabel,
} from "@/lib/product-options";
import { productInputSchema, type ProductData, type ProductInput } from "@/lib/schemas/product";
import { cn } from "@/lib/utils";
import { PhotoPicker } from "./photo-picker";

type ProductRow = Serialized<Product>;

const field =
  "w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-ink focus:border-mauve focus:outline-none";
const CUSTOM = "__custom";

function initialValues(p?: ProductRow): ProductInput {
  if (!p) {
    return {
      name: "",
      description: "",
      shortDescription: "",
      price: 0,
      category: CATEGORY_KEYS[0],
      subcategory: CATEGORIES[CATEGORY_KEYS[0]].types[0],
      brand: "",
      tags: [],
      attributes: {},
      featured: false,
      bestSeller: false,
      newArrival: false,
      images: [],
      colorImages: {},
      variants: [],
      stock: 0,
    };
  }
  return {
    name: p.name,
    description: p.description,
    shortDescription: p.shortDescription ?? "",
    price: p.price,
    category: p.category,
    subcategory: p.subcategory,
    brand: p.brand ?? "",
    tags: p.tags,
    attributes: p.attributes,
    featured: p.featured,
    bestSeller: p.bestSeller,
    newArrival: p.newArrival,
    images: p.images,
    colorImages: p.colorImages,
    variants: p.variants.map((v) => ({ color: v.color, colorHex: v.colorHex, size: v.size, stock: v.stock, sku: v.sku })),
    stock: p.variants.length > 0 ? 0 : p.stock,
  };
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-2xl border border-border p-3 sm:p-4">
      <div>
        <h3 className="font-heading text-base font-bold text-ink">{title}</h3>
        {hint && <p className="text-xs text-muted-ink">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-sm text-body">
      {children}
    </label>
  );
}

export function ProductForm({ product, onDone }: { product?: ProductRow; onDone: () => void }) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ProductInput, unknown, ProductData>({
    resolver: zodResolver(productInputSchema),
    defaultValues: initialValues(product),
  });

  const category = useWatch({ control, name: "category" });
  const variants = useWatch({ control, name: "variants" }) ?? [];
  const attributes = useWatch({ control, name: "attributes" }) ?? {};
  const images = useWatch({ control, name: "images" }) ?? [];
  const colorImages = useWatch({ control, name: "colorImages" }) ?? {};
  const cfg = CATEGORIES[category];

  const [tagsText, setTagsText] = useState(product?.tags.join(", ") ?? "");
  const [curlyTouched, setCurlyTouched] = useState(Boolean(product?.attributes.curly));
  const [formError, setFormError] = useState<string | null>(null);

  // Variant builder state.
  const firstColor = (key: string) => CATEGORIES[key].colors[0]?.name ?? CUSTOM;
  const [builderColor, setBuilderColor] = useState(product ? "" : firstColor(CATEGORY_KEYS[0]));
  const [customName, setCustomName] = useState("");
  const [customHex, setCustomHex] = useState("#8f4464");
  const [pickedSizes, setPickedSizes] = useState<string[]>([]);
  const [freeSizes, setFreeSizes] = useState("");
  const [builderStock, setBuilderStock] = useState(5);

  const colors = [...new Set(variants.map((v) => v.color).filter((c): c is string => !!c))];
  const totalStock = variants.reduce((n, v) => n + (Number(v.stock) || 0), 0);

  const swatchFor = (color: string) => {
    const preset = findPresetColor(category, color);
    if (preset) return colorCss(preset);
    return colorCss({ hex: variants.find((v) => v.color === color)?.colorHex });
  };

  function onCategoryChange(next: string) {
    // A different category has different options, so everything tied to the old one starts again.
    setValue("category", next);
    setValue("subcategory", CATEGORIES[next].types[0]);
    setValue("attributes", {});
    setValue("variants", []);
    setValue("colorImages", {});
    setCurlyTouched(false);
    setBuilderColor(firstColor(next));
    setPickedSizes([]);
    setFreeSizes("");
  }

  function setAttribute(key: string, value: string) {
    const next = { ...attributes, [key]: value };
    if (key === "curly") setCurlyTouched(true);
    // Curly follows the texture until the admin sets it by hand.
    if (key === "texture" && !curlyTouched) {
      const curly = curlyFromTexture(value);
      if (curly) next.curly = curly;
    }
    setValue("attributes", next);
  }

  function addOptions() {
    let color: string | undefined;
    let colorHex: string | undefined;
    if (builderColor === CUSTOM) {
      color = customName.trim();
      colorHex = customHex;
      if (!color) return toast.error("Give the custom colour a name.");
    } else if (builderColor) {
      color = builderColor;
      colorHex = findPresetColor(category, builderColor)?.hex;
    }

    const sizes: (string | undefined)[] = cfg.sizes
      ? pickedSizes
      : freeSizes
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
    if (sizes.length === 0) sizes.push(undefined);
    if (!color && sizes[0] === undefined) return toast.error("Choose a colour, some sizes, or both.");

    const hasSizes = variants.some((v) => v.size);
    const hasColors = variants.some((v) => v.color);
    if (variants.length > 0 && (hasSizes !== Boolean(sizes[0]) || hasColors !== Boolean(color))) {
      return toast.error("Use the same kind of options on every variant: all with colours, all with sizes, or both.");
    }

    // A (colour, size) pair exists once: adding it again just updates its stock.
    const byId = new Map(variants.map((v) => [variantId(v.color, v.size), v]));
    for (const size of sizes) {
      byId.set(variantId(color, size), { color, colorHex, size, stock: Math.max(0, Math.floor(builderStock) || 0) });
    }
    setValue("variants", [...byId.values()]);
    setPickedSizes([]);
    setFreeSizes("");
  }

  function setVariantStock(index: number, stock: number) {
    setValue(
      "variants",
      variants.map((v, i) => (i === index ? { ...v, stock: Math.max(0, Math.floor(stock) || 0) } : v))
    );
  }

  async function onSubmit(values: ProductData) {
    setFormError(null);
    const payload = {
      ...values,
      tags: tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };
    try {
      await api(product ? `/api/products/${product.id}` : "/api/products", {
        method: product ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success(product ? "Product saved" : "Product created");
      onDone();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not save the product.";
      setFormError(message);
      toast.error(message);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Section title="Basics">
        <div>
          <Label htmlFor="p-name">Name</Label>
          <input id="p-name" className={field} {...register("name")} />
          {errors.name && <p role="alert" className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div>
          <Label htmlFor="p-short">Short description (shown under the name)</Label>
          <input id="p-short" className={field} {...register("shortDescription")} />
        </div>
        <div>
          <Label htmlFor="p-desc">Description</Label>
          <textarea id="p-desc" rows={4} className={field} {...register("description")} />
          {errors.description && <p role="alert" className="mt-1 text-xs text-destructive">{errors.description.message}</p>}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="p-price">Price (KES)</Label>
            <input id="p-price" type="number" inputMode="numeric" min={1} step={1} className={field} {...register("price", { valueAsNumber: true })} />
            {errors.price && <p role="alert" className="mt-1 text-xs text-destructive">{errors.price.message}</p>}
          </div>
          <div>
            <Label htmlFor="p-brand">Brand</Label>
            <input id="p-brand" className={field} {...register("brand")} />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="p-category">Category</Label>
            <select id="p-category" value={category} onChange={(e) => onCategoryChange(e.target.value)} className={field}>
              {CATEGORY_KEYS.map((k) => (
                <option key={k} value={k}>
                  {CATEGORIES[k].label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="p-type">Type</Label>
            <select id="p-type" className={field} {...register("subcategory")}>
              {cfg.types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <Label htmlFor="p-tags">Tags (separate with commas)</Label>
          <input id="p-tags" value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="glueless, beginner friendly" className={field} />
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          {(
            [
              ["featured", "Featured"],
              ["bestSeller", "Best seller"],
              ["newArrival", "New arrival"],
            ] as const
          ).map(([name, label]) => (
            <label key={name} className="flex min-h-10 items-center gap-2 text-sm text-body">
              <input type="checkbox" className="size-4 accent-mauve" {...register(name)} /> {label}
            </label>
          ))}
        </div>
      </Section>

      {cfg.attributes.length > 0 && (
        <Section title={`${cfg.label} details`} hint="These appear as specs on the product page, and the starred ones become shop filters.">
          <div className="grid gap-3 sm:grid-cols-2">
            {cfg.attributes.map((attr) => (
              <div key={attr.key}>
                <Label htmlFor={`attr-${attr.key}`}>
                  {attr.label}
                  {attr.filterable && <span className="text-mauve"> ★</span>}
                </Label>
                <select id={`attr-${attr.key}`} value={attributes[attr.key] ?? ""} onChange={(e) => setAttribute(attr.key, e.target.value)} className={field}>
                  <option value="">Not set</option>
                  {attr.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Colours and sizes" hint="Pick a colour and sizes, set the stock, then Add options. Each colour and size pair is one option with its own stock.">
        <div className="grid gap-3 sm:grid-cols-[1fr_6rem]">
          <div className="space-y-2">
            <Label htmlFor="b-color">Colour</Label>
            <select id="b-color" value={builderColor} onChange={(e) => setBuilderColor(e.target.value)} className={field}>
              <option value="">No colour (sizes only)</option>
              {cfg.colors.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
              <option value={CUSTOM}>Custom colour…</option>
            </select>
            {builderColor === CUSTOM && (
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="b-custom-name">Colour name</Label>
                  <input id="b-custom-name" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="e.g. Rose Gold" className={field} />
                </div>
                <div>
                  <Label htmlFor="b-custom-hex">Swatch</Label>
                  <input id="b-custom-hex" type="color" value={customHex} onChange={(e) => setCustomHex(e.target.value)} className="h-[42px] w-14 cursor-pointer rounded-xl border border-border bg-white p-1" />
                </div>
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="b-stock">Stock each</Label>
            <input id="b-stock" type="number" inputMode="numeric" min={0} value={builderStock} onChange={(e) => setBuilderStock(Number(e.target.value))} className={field} />
          </div>
        </div>

        <div>
          <p className="mb-1 text-sm text-body">{cfg.sizeLabel}</p>
          {cfg.sizes ? (
            <div className="flex flex-wrap gap-2" role="group" aria-label={cfg.sizeLabel}>
              {cfg.sizes.map((s) => {
                const on = pickedSizes.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setPickedSizes(on ? pickedSizes.filter((x) => x !== s) : [...pickedSizes, s])}
                    className={cn("min-h-10 min-w-11 rounded-full border px-3 text-sm font-medium", on ? "border-ink bg-ink text-white" : "border-border bg-white text-body hover:border-mauve")}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          ) : (
            <>
              <label htmlFor="b-free-sizes" className="sr-only">
                {cfg.sizeLabel}, separated by commas
              </label>
              <input id="b-free-sizes" value={freeSizes} onChange={(e) => setFreeSizes(e.target.value)} placeholder="e.g. 50ml, 100ml (separate with commas, or leave empty)" className={field} />
            </>
          )}
        </div>

        <button type="button" onClick={addOptions} className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-white hover:bg-ink-hover">
          <Plus className="size-4" /> Add options
        </button>

        {variants.length > 0 ? (
          <div>
            <ul className="flex flex-wrap gap-2" aria-label="Options">
              {variants.map((v, i) => (
                <li key={variantId(v.color, v.size)} className="flex items-center gap-2 rounded-full border border-border bg-white py-1 pl-2 pr-1">
                  {v.color && <span className="size-4 shrink-0 rounded-full border border-black/10" style={{ background: swatchFor(v.color) }} />}
                  <span className="text-sm text-ink">{variantLabel(v)}</span>
                  <label className="sr-only" htmlFor={`vs-${i}`}>
                    Stock for {variantLabel(v)}
                  </label>
                  <input
                    id={`vs-${i}`}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={v.stock}
                    onChange={(e) => setVariantStock(i, Number(e.target.value))}
                    className="h-8 w-14 rounded-full border border-border px-2 text-center text-sm focus:border-mauve focus:outline-none"
                  />
                  <button
                    type="button"
                    aria-label={`Remove ${variantLabel(v)}`}
                    onClick={() => setValue("variants", variants.filter((_, idx) => idx !== i))}
                    className="grid size-8 place-items-center rounded-full text-muted-ink hover:bg-blush hover:text-mauve"
                  >
                    <X className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-body" aria-live="polite">
              Total stock: <strong className="text-ink">{totalStock}</strong> <span className="text-xs text-muted-ink">(worked out from the options)</span>
            </p>
          </div>
        ) : (
          <div className="max-w-xs">
            <Label htmlFor="p-stock">Stock (no options)</Label>
            <input id="p-stock" type="number" inputMode="numeric" min={0} className={field} {...register("stock", { valueAsNumber: true })} />
          </div>
        )}
      </Section>

      <Section title="Photos" hint="The first photo is the main one. Photos are resized to 1100px before upload.">
        {colors.map((color) => (
          <PhotoPicker
            key={color}
            title={color}
            swatch={swatchFor(color)}
            urls={colorImages[color] ?? []}
            onChange={(urls) => setValue("colorImages", { ...colorImages, [color]: urls })}
            hint="Shown when a shopper picks this colour."
          />
        ))}
        <PhotoPicker
          title="General photos"
          urls={images}
          onChange={(urls) => setValue("images", urls)}
          hint={colors.length > 0 ? "Used for colours that have no photos of their own." : "Shown on the product page and in listings."}
        />
      </Section>

      {formError && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-destructive">
          {formError}
        </p>
      )}

      <div className="sticky bottom-0 -mx-1 flex flex-col-reverse gap-2 border-t border-border bg-white/95 px-1 py-3 backdrop-blur sm:flex-row sm:justify-end">
        <button type="button" onClick={onDone} className="h-11 rounded-full border border-border px-6 text-sm font-semibold text-ink hover:border-mauve hover:text-mauve">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting} className="h-11 rounded-full bg-ink px-8 text-sm font-semibold text-white hover:bg-ink-hover disabled:opacity-60">
          {isSubmitting ? "Saving…" : product ? "Save changes" : "Create product"}
        </button>
      </div>
    </form>
  );
}
