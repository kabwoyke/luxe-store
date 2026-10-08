"use client";

import { useRef, useState } from "react";
import { ImagePlus, Link2, Star, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/admin-api";
import { imageRefSchema } from "@/lib/schemas/product";
import { resizeImage } from "@/lib/resize-image";
import { ProductImage } from "@/components/shop/product-image";

/** Uploads one photo (resized in the browser first) and returns its stored URL. */
async function uploadPhoto(file: File): Promise<string> {
  const blob = await resizeImage(file);
  const form = new FormData();
  form.append("file", blob, "photo.jpg");
  const { url } = await api<{ url: string }>("/api/admin/upload", { method: "POST", body: form });
  return url;
}

/** A list of photos with upload, paste-a-URL, remove and "make main". The first photo is the main one. */
export function PhotoPicker({
  title,
  hint,
  swatch,
  urls,
  onChange,
}: {
  title: string;
  hint?: string;
  /** CSS background for a colour dot beside the title. */
  swatch?: string;
  urls: string[];
  onChange: (urls: string[]) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [pasted, setPasted] = useState("");
  const idBase = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    const added: string[] = [];
    for (const file of Array.from(files)) {
      try {
        added.push(await uploadPhoto(file));
      } catch (e) {
        toast.error(`${file.name}: ${e instanceof Error ? e.message : "upload failed"}`);
      }
    }
    if (added.length > 0) onChange([...urls, ...added]);
    setBusy(false);
    if (fileInput.current) fileInput.current.value = "";
  }

  function addPasted() {
    const parsed = imageRefSchema.safeParse(pasted);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (!/^https?:\/\//i.test(parsed.data)) return toast.error("Paste a full link starting with https://");
    onChange([...urls, parsed.data]);
    setPasted("");
  }

  return (
    <div className="rounded-2xl border border-border bg-page p-3 sm:p-4">
      <div className="mb-2 flex items-center gap-2">
        {swatch && <span className="size-4 shrink-0 rounded-full border border-black/10" style={{ background: swatch }} />}
        <h4 className="font-heading text-sm font-semibold text-ink">{title}</h4>
        <span className="text-xs text-muted-ink">
          {urls.length} {urls.length === 1 ? "photo" : "photos"}
        </span>
      </div>
      {hint && <p className="mb-2 text-xs text-muted-ink">{hint}</p>}

      {urls.length > 0 && (
        <ul className="mb-3 flex flex-wrap gap-2">
          {urls.map((url, i) => (
            <li key={url} className="relative">
              <span className="relative block size-20 overflow-hidden rounded-xl border border-border bg-blush">
                <ProductImage src={url} alt={`${title} photo ${i + 1}`} sizes="80px" className="object-cover" />
              </span>
              {i === 0 ? (
                <span className="absolute bottom-1 left-1 rounded-full bg-ink/85 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white">Main</span>
              ) : (
                <button
                  type="button"
                  aria-label={`Make photo ${i + 1} the main photo`}
                  title="Make main"
                  onClick={() => onChange([url, ...urls.filter((u) => u !== url)])}
                  className="absolute bottom-1 left-1 grid size-6 place-items-center rounded-full bg-white/90 text-mauve shadow-sm"
                >
                  <Star className="size-3.5" />
                </button>
              )}
              <button
                type="button"
                aria-label={`Remove photo ${i + 1}`}
                onClick={() => onChange(urls.filter((u) => u !== url))}
                className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full bg-ink text-white shadow"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input ref={fileInput} id={`${idBase}-files`} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => onFiles(e.target.files)} />
        <label
          htmlFor={`${idBase}-files`}
          className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full border border-border bg-white px-4 text-sm font-semibold text-ink transition-colors hover:border-mauve hover:text-mauve"
        >
          <ImagePlus className="size-4" /> {busy ? "Uploading…" : "Upload photos"}
        </label>
        <div className="flex flex-1 gap-2">
          <label htmlFor={`${idBase}-url`} className="sr-only">
            Paste an image link for {title}
          </label>
          <input
            id={`${idBase}-url`}
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addPasted();
              }
            }}
            placeholder="…or paste an image link"
            className="h-10 min-w-0 flex-1 rounded-full border border-border bg-white px-4 text-sm focus:border-mauve focus:outline-none"
          />
          <button
            type="button"
            onClick={addPasted}
            disabled={!pasted.trim()}
            aria-label={`Add image link to ${title}`}
            className="grid size-10 shrink-0 place-items-center rounded-full border border-border bg-white text-ink hover:border-mauve hover:text-mauve disabled:opacity-40"
          >
            <Link2 className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
