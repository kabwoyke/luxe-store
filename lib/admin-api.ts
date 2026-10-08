/** Client-side helpers for the admin screens. */

/** What a value looks like after a trip through JSON: dates become strings. */
export type Serialized<T> = T extends Date
  ? string
  : T extends (infer U)[]
    ? Serialized<U>[]
    : T extends object
      ? { [K in keyof T]: Serialized<T[K]> }
      : T;

/** Fetches JSON and turns a failed response into an Error carrying the server's message. */
export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: init?.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json", ...init.headers } : init?.headers,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? "Something went wrong. Please try again.");
  return body as T;
}
