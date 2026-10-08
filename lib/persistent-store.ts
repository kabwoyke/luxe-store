import { useSyncExternalStore } from "react";

/**
 * A tiny localStorage-backed store for client state (cart, wishlist).
 * The server and the first client render see `initial`; the stored value appears right after hydration.
 */
export function createPersistentStore<T>(key: string, initial: T, isValid: (value: unknown) => value is T) {
  let value = initial;
  let loaded = false;
  const listeners = new Set<() => void>();

  function load() {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isValid(parsed)) value = parsed;
      }
    } catch {
      // Storage can be blocked or corrupted; start empty.
    }
  }

  function emit() {
    listeners.forEach((l) => l());
  }

  if (typeof window !== "undefined") {
    // Keep other tabs in sync.
    window.addEventListener("storage", (e) => {
      if (e.key !== key) return;
      loaded = false;
      value = initial;
      load();
      emit();
    });
  }

  return {
    get(): T {
      load();
      return value;
    },
    set(next: T) {
      load();
      value = next;
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Not persisted, but still works for this session.
      }
      emit();
    },
    use(): T {
      return useSyncExternalStore(
        (listener) => {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
        () => {
          load();
          return value;
        },
        () => initial
      );
    },
  };
}
