import { db } from "@/db";
import { products } from "@/db/schema";
import { getAllProducts } from "@/lib/catalog";
import { resolveStoreId, revalidateCatalog } from "@/lib/catalog-admin";
import { buildProductValues } from "@/lib/product-write";
import { matchesQuery } from "@/lib/product-options";
import { productInputSchema } from "@/lib/schemas/product";
import { requireApiAdmin } from "@/lib/session";

/** Public catalogue: ?category=Wigs and ?q=search words are optional. */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const category = params.get("category");
  const q = params.get("q")?.trim();

  let list = await getAllProducts();
  if (category) list = list.filter((p) => p.category.toLowerCase() === category.toLowerCase());
  if (q) list = list.filter((p) => matchesQuery(p, q));
  return Response.json({ products: list });
}

/** Admin: create a product. */
export async function POST(request: Request) {
  const admin = await requireApiAdmin();
  if (admin instanceof Response) return admin;

  const parsed = productInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid product." }, { status: 400 });
  }
  const built = buildProductValues(parsed.data);
  if (!built.ok) return Response.json({ error: built.error }, { status: 400 });

  const storeId = await resolveStoreId(parsed.data.category, parsed.data.storeId);
  if (!storeId) return Response.json({ error: "No store exists to put this product in." }, { status: 400 });

  const [created] = await db.insert(products).values({ ...built.values, storeId });
  revalidateCatalog();
  return Response.json({ id: created.insertId }, { status: 201 });
}
