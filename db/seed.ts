import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { db, pool } from "./index";
import { collections, products, reviews, stores, users, type NewProduct } from "./schema";
import {
  CATEGORIES,
  curlyFromTexture,
  sumVariantStock,
  variantId,
  type Variant,
} from "../lib/product-options";

/* ---------- product builder ---------- */

type Spec = {
  storeSlug: string;
  name: string;
  description: string;
  shortDescription: string;
  price: number;
  category: string;
  subcategory: string;
  brand: string;
  tags: string[];
  attributes: Record<string, string>;
  /** Stock photos in public/products. One set shared by every colour until real per-colour photos are uploaded. */
  photos: string[];
  colors: string[];
  sizes: string[];
  /** Starting stock; it drops a little per colour and size so stock is uneven. */
  baseStock: number;
  /** Exact stock for a "Colour|Size" pair, e.g. 0 for sold out. */
  overrides?: Record<string, number>;
  flags: { featured?: boolean; bestSeller?: boolean; newArrival?: boolean };
};

function buildProduct(spec: Spec, storeId: number): NewProduct {
  const cfg = CATEGORIES[spec.category];
  const defs = spec.colors.map((name) => {
    const def = cfg.colors.find((c) => c.name === name);
    if (!def) throw new Error(`Unknown colour "${name}" for ${spec.category}`);
    return def;
  });

  const variants: Variant[] = defs.flatMap((color, ci) =>
    spec.sizes.map((size, si) => ({
      id: variantId(color.name, size),
      color: color.name,
      colorHex: color.hex,
      size,
      stock:
        spec.overrides?.[`${color.name}|${size}`] ??
        Math.max(1, spec.baseStock - ci * 2 - si),
    }))
  );

  return {
    storeId,
    name: spec.name,
    description: spec.description,
    shortDescription: spec.shortDescription,
    price: spec.price,
    category: spec.category,
    subcategory: spec.subcategory,
    brand: spec.brand,
    tags: spec.tags,
    attributes: spec.attributes,
    stock: sumVariantStock(variants),
    imageUrl: spec.photos[0],
    images: spec.photos,
    // Colours without their own photos fall back to the default gallery.
    colorImages: {},
    variants,
    ...spec.flags,
  };
}

const wig = (texture: string, rest: Record<string, string>) => ({
  texture,
  curly: curlyFromTexture(texture) ?? "No",
  ...rest,
});

const SPECS: Spec[] = [
  {
    storeSlug: "luxe-wigs",
    name: "Body Wave Lace Frontal Wig",
    description:
      "A full, bouncy wig with a pre-plucked 13x4 HD lace frontal for a natural hairline. Soft, tangle-resistant and easy to restyle.",
    shortDescription: "Pre-plucked HD lace frontal with soft waves.",
    price: 28500,
    category: "Wigs",
    subcategory: "Frontal Wig",
    brand: "Luxe Hair",
    tags: ["frontal", "hd lace", "pre-plucked"],
    attributes: wig("Body Wave", {
      hairType: "Human Hair",
      construction: "13x4 Frontal",
      laceType: "HD Lace",
      density: "180%",
      glueless: "No",
      capSize: "Average",
    }),
    photos: ["/products/body-wave-frontal-wig-1.jpg", "/products/body-wave-frontal-wig-2.jpg"],
    colors: ["Natural Black", "Honey Blonde", "Burgundy"],
    sizes: ['16"', '18"', '20"', '24"'],
    baseStock: 9,
    overrides: { 'Honey Blonde|24"': 0, 'Burgundy|16"': 2 },
    flags: { featured: true, bestSeller: true },
  },
  {
    storeSlug: "luxe-wigs",
    name: "Glueless Straight Closure Wig",
    description:
      "Put it on and go: an elastic band and adjustable straps hold this 5x5 closure wig in place with no glue or adhesive needed.",
    shortDescription: "Wear-and-go 5x5 closure, no glue needed.",
    price: 22000,
    category: "Wigs",
    subcategory: "Glueless Wig",
    brand: "Luxe Hair",
    tags: ["glueless", "beginner friendly", "wear and go"],
    attributes: wig("Straight", {
      hairType: "Remy Human Hair",
      construction: "5x5 Closure",
      laceType: "Transparent Lace",
      density: "150%",
      glueless: "Yes",
      capSize: "Average",
    }),
    photos: ["/products/glueless-straight-wig.jpg"],
    colors: ["Jet Black", "Dark Brown"],
    sizes: ['14"', '16"', '18"', '20"'],
    baseStock: 8,
    overrides: { 'Dark Brown|20"': 1 },
    flags: { bestSeller: true, newArrival: true },
  },
  {
    storeSlug: "luxe-wigs",
    name: "Kinky Curly U-Part Wig",
    description:
      "Blend it with your natural hair. This U-part wig gives voluminous, defined coils with a realistic finish and no leave-out hassle.",
    shortDescription: "Voluminous coils, easy to blend.",
    price: 15500,
    category: "Wigs",
    subcategory: "U-Part Wig",
    brand: "Luxe Hair",
    tags: ["u-part", "voluminous", "natural look"],
    attributes: wig("Kinky Curly", {
      hairType: "Semi-Human Hair",
      construction: "U-Part",
      laceType: "None",
      density: "200%",
      glueless: "Yes",
      capSize: "Large",
    }),
    photos: ["/products/kinky-curly-u-part-wig.jpg"],
    colors: ["Natural Black", "Ginger", "Ombre Brown"],
    sizes: ['14"', '16"', '18"'],
    baseStock: 6,
    overrides: { 'Ginger|18"': 0 },
    flags: { newArrival: true },
  },
  {
    storeSlug: "luxe-wigs",
    name: "Bouncy Curl Bob Wig",
    description:
      "A playful, lightweight bob with defined bouncy ringlets. Heat-friendly fibre keeps its shape wash after wash.",
    shortDescription: "Lightweight bob with bouncy ringlets.",
    price: 6800,
    category: "Wigs",
    subcategory: "Bob Wig",
    brand: "Luxe Hair",
    tags: ["bob", "lightweight", "heat friendly"],
    attributes: wig("Bouncy Curl", {
      hairType: "Synthetic",
      construction: "No Lace",
      laceType: "None",
      density: "130%",
      glueless: "Yes",
      capSize: "Average",
    }),
    photos: ["/products/bouncy-curl-bob-wig.jpg"],
    colors: ["Natural Black", "Pink", "Ombre Blonde", "Silver Grey"],
    sizes: ['10"', '12"'],
    baseStock: 12,
    overrides: { 'Pink|12"': 0 },
    flags: { featured: true, newArrival: true },
  },
  {
    storeSlug: "luxe-main",
    name: "Everyday Leather Sneakers",
    description:
      "Clean, minimal sneakers with a cushioned insole and a grippy rubber sole. Dress them up or down all day.",
    shortDescription: "Minimal leather sneakers with cushioned insoles.",
    price: 7900,
    category: "Shoes",
    subcategory: "Sneakers",
    brand: "Luxe Steps",
    tags: ["everyday", "comfortable", "minimal"],
    attributes: { material: "Leather", heelHeight: "Flat", occasion: "Casual" },
    photos: ["/products/leather-sneakers.jpg"],
    colors: ["White", "Black", "Beige"],
    sizes: ["38", "39", "40", "41", "42"],
    baseStock: 7,
    overrides: { "Black|41": 0, "Beige|38": 3 },
    flags: { bestSeller: true, newArrival: true },
  },
  {
    storeSlug: "luxe-main",
    name: "Block Heel Sandals",
    description:
      "Stable block heels with an adjustable ankle strap. Elegant for evenings and comfortable enough to dance in.",
    shortDescription: "Comfortable block heels with an ankle strap.",
    price: 6500,
    category: "Shoes",
    subcategory: "Sandals",
    brand: "Luxe Steps",
    tags: ["block heel", "ankle strap", "evening"],
    attributes: { material: "Satin", heelHeight: "Mid (2-3 in)", occasion: "Party" },
    photos: ["/products/block-heel-sandals.jpg"],
    colors: ["Nude", "Black", "Gold"],
    sizes: ["36", "37", "38", "39", "40", "41"],
    baseStock: 6,
    overrides: { "Nude|38": 0, "Gold|40": 3, "Gold|41": 2 },
    flags: { featured: true },
  },
  {
    storeSlug: "luxe-main",
    name: "Classic Leather Tote",
    description:
      "A structured everyday tote with room for a laptop, a lunchbox and everything else. An interior zip pocket keeps essentials safe.",
    shortDescription: "Roomy structured tote for work and weekends.",
    price: 9800,
    category: "Handbags",
    subcategory: "Totes",
    brand: "Luxe Carry",
    tags: ["work bag", "laptop friendly", "everyday"],
    attributes: { material: "Leather", closure: "Zip", strap: "Top Handle" },
    photos: ["/products/leather-tote.jpg"],
    colors: ["Cognac Tan", "Black", "Cream"],
    sizes: ["Medium", "Large"],
    baseStock: 6,
    overrides: { "Cream|Large": 0 },
    flags: { bestSeller: true },
  },
  {
    storeSlug: "luxe-main",
    name: "Mini Crossbody Bag",
    description:
      "Compact but clever. Holds your phone, cards and lipstick, with a detachable chain strap you can wear two ways.",
    shortDescription: "Pocket-sized crossbody with a chain strap.",
    price: 4200,
    category: "Handbags",
    subcategory: "Crossbody",
    brand: "Luxe Carry",
    tags: ["mini", "evening", "chain strap"],
    attributes: {
      material: "Faux Leather",
      closure: "Magnetic Snap",
      strap: "Crossbody Strap",
    },
    photos: ["/products/mini-crossbody-bag.jpg"],
    colors: ["Pink", "Black", "Burgundy"],
    sizes: ["Mini", "Small"],
    baseStock: 10,
    overrides: { "Burgundy|Mini": 0, "Pink|Small": 4 },
    flags: { featured: true, newArrival: true },
  },
];

/* ---------- seeding: every step skips what already exists ---------- */

const counts = { users: 0, stores: 0, products: 0, reviews: 0, collections: 0 };

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn("ADMIN_EMAIL / ADMIN_PASSWORD not set: skipping admin user.");
    return;
  }
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email));
  if (existing) return;
  await db.insert(users).values({
    email,
    passwordHash: await bcrypt.hash(password, 12),
    firstName: "Admin",
    lastName: "LUXESTORE",
    isAdmin: true,
  });
  counts.users++;
}

async function seedStores() {
  const defs = [
    { slug: "luxe-wigs", name: "Luxe Wigs", color: "#8f4464" },
    { slug: "luxe-main", name: "Luxe Main Store", color: "#2d1a2d" },
  ];
  const ids: Record<string, number> = {};
  for (const def of defs) {
    const [existing] = await db
      .select({ id: stores.id })
      .from(stores)
      .where(eq(stores.slug, def.slug));
    if (existing) {
      ids[def.slug] = existing.id;
      continue;
    }
    const [res] = await db.insert(stores).values(def);
    ids[def.slug] = res.insertId;
    counts.stores++;
  }
  return ids;
}

async function seedProducts(storeIds: Record<string, number>) {
  const idsByName: Record<string, number> = {};
  for (const spec of SPECS) {
    const [existing] = await db
      .select({ id: products.id, imageUrl: products.imageUrl })
      .from(products)
      .where(eq(products.name, spec.name));
    if (existing) {
      idsByName[spec.name] = existing.id;
      // Move rows seeded with the old placeholder art onto the stock photos,
      // but never touch photos an admin has uploaded since.
      if (existing.imageUrl.startsWith("/placeholder")) {
        await db
          .update(products)
          .set({ imageUrl: spec.photos[0], images: spec.photos, colorImages: {} })
          .where(eq(products.id, existing.id));
      }
      continue;
    }
    const [res] = await db
      .insert(products)
      .values(buildProduct(spec, storeIds[spec.storeSlug]));
    idsByName[spec.name] = res.insertId;
    counts.products++;
  }
  return idsByName;
}

const REVIEWS = [
  { product: "Body Wave Lace Frontal Wig", userName: "Amina W.", rating: 5, comment: "The lace melts into my skin and the waves hold all week. Delivery to Nairobi took two days." },
  { product: "Body Wave Lace Frontal Wig", userName: "Grace M.", rating: 4, comment: "Beautiful hair, very full. I plucked the hairline a little more for my skin tone." },
  { product: "Glueless Straight Closure Wig", userName: "Faith K.", rating: 5, comment: "So easy to put on, no glue and no stress. I wear it to work every day." },
  { product: "Everyday Leather Sneakers", userName: "Brian O.", rating: 5, comment: "Comfortable from day one and they go with everything." },
  { product: "Block Heel Sandals", userName: "Naomi A.", rating: 4, comment: "Lovely for evenings out. I sized up half a size and they fit perfectly." },
  { product: "Classic Leather Tote", userName: "Linet C.", rating: 5, comment: "Fits my laptop and a lunchbox with room to spare. The leather smells great." },
];

async function seedReviews(idsByName: Record<string, number>) {
  for (const r of REVIEWS) {
    const productId = idsByName[r.product];
    const [existing] = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(and(eq(reviews.productId, productId), eq(reviews.userName, r.userName)));
    if (existing) continue;
    await db.insert(reviews).values({ productId, userName: r.userName, rating: r.rating, comment: r.comment });
    counts.reviews++;
  }
}

async function seedCollections(idsByName: Record<string, number>) {
  const idsWhere = (pick: (s: Spec) => boolean) =>
    SPECS.filter(pick).map((s) => idsByName[s.name]);
  const defs = [
    {
      slug: "new-arrivals",
      name: "New Arrivals",
      description: "The latest pieces, fresh in this week.",
      productIds: idsWhere((s) => !!s.flags.newArrival),
    },
    {
      slug: "the-hair-edit",
      name: "The Hair Edit",
      description: "Wigs and styles, from sleek straight to bouncy curls.",
      productIds: idsWhere((s) => s.category === "Wigs"),
    },
  ];
  for (const def of defs) {
    const [existing] = await db
      .select({ id: collections.id })
      .from(collections)
      .where(eq(collections.slug, def.slug));
    if (existing) continue;
    await db.insert(collections).values(def);
    counts.collections++;
  }
}

/** Row locks and transactions only exist on InnoDB. Refuse to seed a database that is not. */
async function assertInnoDb() {
  const [rows] = await pool.query(
    "select table_name as name, engine from information_schema.tables where table_schema = database() and engine <> 'InnoDB' and table_name not like '%drizzle%'"
  );
  const bad = (rows as { name: string; engine: string }[]).map((r) => `${r.name} (${r.engine})`);
  if (bad.length > 0) {
    throw new Error(
      `These tables are not InnoDB: ${bad.join(", ")}. Orders and payments need transactions and row locks. ` +
        "Run ALTER TABLE <name> ENGINE=InnoDB, or set default-storage-engine=InnoDB in my.ini and recreate the database."
    );
  }
}

async function main() {
  await assertInnoDb();
  await seedAdmin();
  const storeIds = await seedStores();
  const idsByName = await seedProducts(storeIds);
  await seedReviews(idsByName);
  await seedCollections(idsByName);
  console.log("Seed added:", counts);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
