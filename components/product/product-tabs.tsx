"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

export type TabDef = { id: string; label: string; content: React.ReactNode };

/** Tab bar scrolls horizontally on small screens instead of wrapping. */
export function ProductTabs({ tabs }: { tabs: TabDef[] }) {
  const [active, setActive] = useState(tabs[0].id);
  const base = useId();

  function onKeyDown(e: React.KeyboardEvent, i: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const next = tabs[(i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
    setActive(next.id);
    document.getElementById(`${base}-tab-${next.id}`)?.focus();
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label="Product information"
        className="no-scrollbar flex gap-1 overflow-x-auto rounded-full bg-blush p-1.5"
      >
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            id={`${base}-tab-${tab.id}`}
            role="tab"
            type="button"
            aria-selected={active === tab.id}
            aria-controls={`${base}-panel-${tab.id}`}
            tabIndex={active === tab.id ? 0 : -1}
            onClick={() => setActive(tab.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "min-h-10 shrink-0 whitespace-nowrap rounded-full px-5 text-sm font-semibold transition-colors",
              active === tab.id ? "bg-white text-ink shadow-sm" : "text-muted-ink hover:text-mauve"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`${base}-panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`${base}-tab-${tab.id}`}
          hidden={active !== tab.id}
          className="pt-6"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
