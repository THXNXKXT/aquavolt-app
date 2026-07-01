/**
 * Wrap an API route handler so thrown errors become structured responses
 * instead of bare 500s. Known error shapes map to specific status codes.
 */
export function route<TArgs extends unknown[]>(
  handler: (...args: TArgs) => Promise<Response>,
): (...args: TArgs) => Promise<Response> {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (e) {
      return toErrorResponse(e);
    }
  };
}

interface PgError {
  code?: string;
  message?: string;
}

export function toErrorResponse(e: unknown): Response {
  // Postgres / drizzle constraint violations (23505 unique, 23503 FK, 23502 not_null…)
  const pg = e as PgError;
  if (pg && typeof pg.code === "string" && pg.code.startsWith("23")) {
    return Response.json({ error: pg.message || "Database constraint violation" }, { status: 409 });
  }
  const err = e as { status?: number; statusCode?: number; message?: string };
  const status = Number(err?.status) || Number(err?.statusCode) || 500;
  const safe = status >= 400 && status < 600 ? status : 500;
  const message =
    safe === 500 ? "Internal server error" : err?.message || "Request failed";
  if (safe === 500) console.error("[route] unhandled:", e);
  return Response.json({ error: message }, { status: safe });
}
