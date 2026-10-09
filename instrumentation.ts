import type { Instrumentation } from "next";

/** Runs once when the server starts: refuses to boot a production build with unsafe settings. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NODE_ENV !== "production") return;
  const { checkEnvironment } = await import("@/lib/env-check");
  const { problems, warnings } = checkEnvironment();
  for (const w of warnings) console.warn(`[config] warning: ${w}`);
  if (problems.length > 0) {
    for (const p of problems) console.error(`[config] ERROR: ${p}`);
    throw new Error(`Unsafe production configuration (${problems.length} problem${problems.length === 1 ? "" : "s"}). See [config] lines above.`);
  }
}

/** Every unhandled server error, with the route that caused it, as one greppable log line. */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const error = err as Error & { digest?: string };
  console.error(
    `[error] ${request.method} ${request.path} (${context.routeType}: ${context.routePath})`,
    error.digest ? `digest=${error.digest}` : "",
    error.stack ?? error.message
  );
};
