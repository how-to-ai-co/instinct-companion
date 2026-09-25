import { isDemo } from "./mode";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
export const COOKIE = "companion-session";
export function equal(a: string, b: string) {
  const x = Buffer.from(a),
    y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
function signature(value: string) {
  return createHmac(
    "sha256",
    process.env.COMPANION_SESSION_SECRET ||
      process.env.COMPANION_PASSWORD ||
      "dev-only",
  )
    .update(value)
    .digest("hex");
}
export function issueSession() {
  const expires = String(Date.now() + 7 * 86400000);
  return `${expires}.${signature(expires)}`;
}
export async function authenticated() {
  if (isDemo || process.env.VERCEL) return false;
  if (process.env.NODE_ENV === "development" && !process.env.COMPANION_PASSWORD)
    return true;
  if (!process.env.COMPANION_PASSWORD) return false;
  const value = (await cookies()).get(COOKIE)?.value || "";
  const [expires, hash] = value.split(".");
  return (
    !!hash && Number(expires) > Date.now() && equal(hash, signature(expires))
  );
}
export async function guard(request?: Request) {
  if (!(await authenticated())) throw new Error("UNAUTHORIZED");
  if (request && !["GET", "HEAD"].includes(request.method)) {
    const origin = request.headers.get("origin");
    const allowed = process.env.COMPANION_ORIGIN || "http://127.0.0.1:8790";
    if (!origin || origin !== allowed) throw new Error("FORBIDDEN");
  }
}
export function fail(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  const codes: Record<string, [number, string]> = {
    REQUEST_CONFLICT: [
      409,
      "This requestId was already used with a different request.",
    ],
    LOGIN_FAILED: [
      502,
      "Could not start ChatGPT sign-in. Try again; device-code sign-in may need enabling in ChatGPT security settings.",
    ],
    AGENT_UNAVAILABLE: [
      503,
      "The ChatGPT runtime is unavailable. Please try again shortly.",
    ],
    BUSY: [409, "The agent is busy. Wait for the current request to finish."],
    UNAUTHORIZED: [401, "Please sign in."],
    FORBIDDEN: [403, "Request origin not allowed."],
    CONFLICT: [409, "This workspace changed. Refresh and try again."],
    NOT_FOUND: [404, "That workspace or item no longer exists."],
    NOT_CONNECTED: [503, "Instinct Companion is not connected yet."],
    ENGINE_UNAVAILABLE: [
      502,
      "Instinct Companion could not be reached. Please try again.",
    ],
  };
  const [status, text] = codes[message] || [
    400,
    "The request could not be completed. Check the input and try again.",
  ];
  return Response.json({ error: text }, { status });
}
