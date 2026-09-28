import { timingSafeEqual } from "node:crypto";
export function hasKey(request: Request) {
  const expected = process.env.COMPANION_INGEST_TOKEN;
  if (!expected || expected.length < 32) return false;
  const a = Buffer.from(request.headers.get("authorization") || "");
  const b = Buffer.from(`Bearer ${expected}`);
  return a.length === b.length && timingSafeEqual(a, b);
}
export async function rpc(name: string, body: unknown = {}) {
  const url = process.env.SUPABASE_URL,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NOT_CONFIGURED");
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    const detail = await response.text();
    if (
      detail.includes("EVENT_CONFLICT") ||
      detail.includes("VERSION_CONFLICT")
    )
      throw new Error("CONFLICT");
    throw new Error("STORAGE_UNAVAILABLE");
  }
  return response.json();
}
export function memoryError(error: unknown) {
  const reason = error instanceof Error ? error.message : "";
  const status = reason === "CONFLICT" ? 409 : 503;
  return Response.json(
    {
      error:
        reason === "CONFLICT"
          ? "This event ID or record version already has different content. Use a new event ID and a higher record version."
          : reason === "NOT_CONFIGURED"
            ? "Supabase has not been configured for this installation."
            : "Storage is temporarily unavailable. Retry with the same event ID.",
    },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
