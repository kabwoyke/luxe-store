"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { api } from "@/lib/admin-api";
import { settingsSchema, type Settings } from "@/lib/schemas/settings";
import { ErrorNote, Loading } from "./ui";

const field =
  "w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-ink focus:border-mauve focus:outline-none";

export function SettingsTab() {
  const { data, error, isPending } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => api<{ settings: Settings; storage: "cloudinary" | "local" }>("/api/admin/settings"),
  });

  if (error) return <ErrorNote error={error} />;
  if (isPending) return <Loading label="Loading settings" />;
  return (
    <div className="space-y-5">
      <SettingsForm initial={data.settings} />
      <section className="max-w-xl rounded-3xl border border-border bg-white p-5 sm:p-6" aria-labelledby="storage-heading">
        <h2 id="storage-heading" className="text-lg font-bold">
          Photo storage
        </h2>
        <p className="mt-1 text-sm text-body">
          {data.storage === "cloudinary"
            ? "Product photos are stored on Cloudinary."
            : "Product photos are stored on this server. Add your Cloudinary keys to .env.local to use Cloudinary instead."}
        </p>
      </section>
    </div>
  );
}

function SettingsForm({ initial }: { initial: Settings }) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<Settings>({ resolver: zodResolver(settingsSchema), defaultValues: initial });

  async function onSubmit(values: Settings) {
    try {
      const saved = await api<{ settings: Settings }>("/api/admin/settings", { method: "PUT", body: JSON.stringify(values) });
      reset(saved.settings);
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Settings saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save settings.");
    }
  }

  const rows: { name: keyof Settings; label: string; hint: string }[] = [
    { name: "freeDeliveryThreshold", label: "Free delivery from (KES)", hint: "Orders at or above this subtotal ship free. Shown in the announcement bar, cart and product pages." },
    { name: "deliveryFee", label: "Delivery fee below that (KES)", hint: "Charged on smaller orders." },
    { name: "lowStockThreshold", label: "Low stock warning (units)", hint: "Options with this many or fewer left appear under Low stock on the overview." },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-xl space-y-5 rounded-3xl border border-border bg-white p-5 sm:p-6">
      <h2 className="text-lg font-bold">Delivery and stock</h2>
      {rows.map((r) => (
        <div key={r.name}>
          <label htmlFor={r.name} className="mb-1 block text-sm text-body">
            {r.label}
          </label>
          <input id={r.name} type="number" inputMode="numeric" min={0} step={1} className={field} {...register(r.name, { valueAsNumber: true })} />
          {errors[r.name] ? (
            <p role="alert" className="mt-1 text-xs text-destructive">
              {errors[r.name]?.message ?? "Enter a whole number."}
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted-ink">{r.hint}</p>
          )}
        </div>
      ))}
      <button
        type="submit"
        disabled={isSubmitting || !isDirty}
        className="h-12 rounded-full bg-ink px-8 text-sm font-semibold text-white transition-colors hover:bg-ink-hover disabled:opacity-50"
      >
        {isSubmitting ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
