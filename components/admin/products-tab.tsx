"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/db/schema";
import { api, type Serialized } from "@/lib/admin-api";
import { formatKES } from "@/lib/format";
import { CATEGORIES, CATEGORY_KEYS, normalizeSearch, productSearchText } from "@/lib/product-options";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProductImage } from "@/components/shop/product-image";
import { ProductForm } from "./product-form";
import { ErrorNote, Loading, TableBox, td, th } from "./ui";

type ProductRow = Serialized<Product>;

const LOW_STOCK = 5;

export function ProductsTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [editing, setEditing] = useState<ProductRow | "new" | null>(null);
  const [deleting, setDeleting] = useState<ProductRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data, error, isPending } = useQuery({
    queryKey: ["products"],
    queryFn: () => api<{ products: ProductRow[] }>("/api/products"),
  });

  const remove = useMutation({
    mutationFn: (id: number) => api(`/api/products/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Product deleted");
      setDeleting(null);
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e) => setDeleteError(e instanceof Error ? e.message : "Could not delete the product."),
  });

  if (error) return <ErrorNote error={error} />;
  if (isPending) return <Loading label="Loading products" />;

  const q = normalizeSearch(search);
  const list = data.products.filter(
    (p) =>
      (category === "all" || p.category === category) &&
      (!q || productSearchText({ ...p, tags: p.tags }).includes(q))
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <label htmlFor="product-search" className="sr-only">
            Search products
          </label>
          <input
            id="product-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="h-11 flex-1 rounded-full border border-border bg-white px-5 text-sm focus:border-mauve focus:outline-none sm:max-w-sm"
          />
          <label htmlFor="product-category" className="sr-only">
            Filter by category
          </label>
          <select
            id="product-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-11 rounded-full border border-border bg-white px-4 text-sm text-body focus:border-mauve focus:outline-none"
          >
            <option value="all">All categories</option>
            {CATEGORY_KEYS.map((k) => (
              <option key={k} value={k}>
                {CATEGORIES[k].label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-white hover:bg-ink-hover"
        >
          <Plus className="size-4" /> Add product
        </button>
      </div>

      <TableBox>
        <table className="w-full min-w-[46rem]">
          <thead className="border-b border-border">
            <tr>
              <th className={th}>Product</th>
              <th className={th}>Category</th>
              <th className={`${th} text-right`}>Price</th>
              <th className={`${th} text-right`}>Stock</th>
              <th className={th}>Tags</th>
              <th className={`${th} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.length === 0 && (
              <tr>
                <td colSpan={6} className={`${td} py-10 text-center`}>
                  No products match.
                </td>
              </tr>
            )}
            {list.map((p) => (
              <tr key={p.id}>
                <td className={td}>
                  <div className="flex items-center gap-3">
                    <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-blush">
                      <ProductImage src={p.imageUrl} alt="" sizes="48px" className="object-cover" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{p.name}</p>
                      <p className="text-xs text-muted-ink">
                        {p.variants.length} {p.variants.length === 1 ? "option" : "options"}
                        {p.brand ? ` · ${p.brand}` : ""}
                      </p>
                    </div>
                  </div>
                </td>
                <td className={td}>
                  {CATEGORIES[p.category]?.label ?? p.category}
                  <p className="text-xs text-muted-ink">{p.subcategory}</p>
                </td>
                <td className={`${td} whitespace-nowrap text-right font-semibold text-ink`}>{formatKES(p.price)}</td>
                <td className={`${td} text-right`}>
                  <span
                    className={cn(
                      "inline-block rounded-full px-2.5 py-1 text-xs font-semibold",
                      p.stock <= 0 ? "bg-red-100 text-red-800" : p.stock <= LOW_STOCK ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                    )}
                  >
                    {p.stock <= 0 ? "Sold out" : p.stock}
                  </span>
                </td>
                <td className={td}>
                  <div className="flex flex-wrap gap-1">
                    {p.featured && <Tag>Featured</Tag>}
                    {p.bestSeller && <Tag>Best seller</Tag>}
                    {p.newArrival && <Tag>New</Tag>}
                  </div>
                </td>
                <td className={td}>
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      aria-label={`Edit ${p.name}`}
                      onClick={() => setEditing(p)}
                      className="grid size-10 place-items-center rounded-full text-ink hover:bg-blush hover:text-mauve"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${p.name}`}
                      onClick={() => {
                        setDeleteError(null);
                        setDeleting(p);
                      }}
                      className="grid size-10 place-items-center rounded-full text-ink hover:bg-red-50 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableBox>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-none overflow-y-auto p-3 sm:max-w-3xl sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-xl">{editing === "new" ? "Add product" : "Edit product"}</DialogTitle>
            <DialogDescription>Customers see changes as soon as you save.</DialogDescription>
          </DialogHeader>
          {editing && (
            <ProductForm key={editing === "new" ? "new" : editing.id} product={editing === "new" ? undefined : editing} onDone={() => setEditing(null)} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-none sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this product?</DialogTitle>
            <DialogDescription>
              {deleting?.name} will be removed from the shop, its reviews and stock history will be deleted, and this cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-destructive">
              {deleteError}
            </p>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setDeleting(null)} className="h-11 rounded-full border border-border px-6 text-sm font-semibold text-ink hover:border-mauve">
              Keep it
            </button>
            <button
              type="button"
              disabled={remove.isPending}
              onClick={() => deleting && remove.mutate(deleting.id)}
              className="h-11 rounded-full bg-destructive px-6 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {remove.isPending ? "Deleting…" : "Delete product"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-blush px-2 py-0.5 text-[11px] font-semibold text-mauve-dark">{children}</span>;
}
