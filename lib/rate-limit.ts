/**
 * Small in-memory sliding-window limiter. It is per server process, so it slows down abuse
 * on a single instance; a shared store (Redis etc.) would be needed behind several instances.
 */
const hits = new Map<string, number[]>();

export function rateLimit(key: string, max: number, windowMs: number): { ok: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return { ok: false, retryAfterSeconds: Math.ceil((windowMs - (now - recent[0])) / 1000) };
  }
  recent.push(now);
  hits.set(key, recent);
  return { ok: true, retryAfterSeconds: 0 };
}
