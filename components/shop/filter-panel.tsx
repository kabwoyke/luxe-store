"use client";

import type { FilterGroup, Selection } from "@/lib/filters";
import { cn } from "@/lib/utils";

export function FilterPanel({
  groups,
  selection,
  onToggle,
  onClear,
  activeCount,
}: {
  groups: FilterGroup[];
  selection: Selection;
  onToggle: (key: string, value: string) => void;
  onClear: () => void;
  activeCount: number;
}) {
  const has = (key: string, value: string) => selection[key]?.includes(value) ?? false;

  return (
    <div className="space-y-6 rounded-3xl border border-border bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="micro-label text-ink">
          Filters{activeCount > 0 && <span className="ml-1.5 rounded-full bg-mauve px-1.5 py-0.5 text-white">{activeCount}</span>}
        </h2>
        {activeCount > 0 && (
          <button type="button" onClick={onClear} className="text-xs font-semibold text-mauve hover:text-mauve-dark">
            Clear
          </button>
        )}
      </div>

      {groups.length === 0 && <p className="text-sm text-muted-ink">No filters available for these products.</p>}

      {groups.map((group) => (
        <fieldset key={group.key} className="space-y-2.5">
          <legend className="micro-label mb-2.5 text-muted-ink">{group.label}</legend>

          {group.kind === "swatch" && (
            <div className="flex flex-wrap gap-2.5">
              {group.options.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  title={o.value}
                  aria-label={o.value}
                  aria-pressed={has(group.key, o.value)}
                  onClick={() => onToggle(group.key, o.value)}
                  className="grid size-10 place-items-center rounded-full"
                >
                  <span
                    className={cn(
                      "block size-7 rounded-full border border-black/10",
                      has(group.key, o.value) && "ring-2 ring-mauve ring-offset-2"
                    )}
                    style={{ background: o.css }}
                  />
                </button>
              ))}
            </div>
          )}

          {group.kind === "pill" && (
            <div className="flex flex-wrap gap-2">
              {group.options.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={has(group.key, o.value)}
                  onClick={() => onToggle(group.key, o.value)}
                  className={cn(
                    "min-h-10 min-w-10 rounded-full border px-3.5 text-sm font-medium transition-colors",
                    has(group.key, o.value)
                      ? "border-ink bg-ink text-white"
                      : "border-border bg-white text-body hover:border-mauve hover:text-mauve"
                  )}
                >
                  {o.value}
                </button>
              ))}
            </div>
          )}

          {group.kind === "check" && (
            <ul className="space-y-1">
              {group.options.map((o) => (
                <li key={o.value}>
                  <label className="flex min-h-10 cursor-pointer items-center gap-3 text-sm text-body">
                    <input
                      type="checkbox"
                      checked={has(group.key, o.value)}
                      onChange={() => onToggle(group.key, o.value)}
                      className="size-4 accent-mauve"
                    />
                    <span className="flex-1">{o.value}</span>
                    <span className="text-xs text-muted-ink">{o.count}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </fieldset>
      ))}
    </div>
  );
}
