import { isDemo } from "@/lib/mode";
import { cookies } from "next/headers";
import { COOKIE, equal, issueSession, fail } from "@/lib/auth";
const attempts = new Map<string, { count: number; until: number }>();
export async function POST(request: Request) {
  try {
    if (isDemo || process.env.VERCEL) throw new Error("UNAUTHORIZED");
    const origin = request.headers.get("origin");
    if (origin !== (process.env.COMPANION_ORIGIN || "http://127.0.0.1:8790"))
      throw new Error("FORBIDDEN");
    const key = request.headers.get("x-forwarded-for") || "local";
    const prior = attempts.get(key);
    const attempt =
      prior && prior.until > Date.now()
        ? prior
        : { count: 0, until: Date.now() + 60000 };
    if (attempt.count >= 10)
      return Response.json(
        { error: "Too many attempts. Try again in a minute." },
        { status: 429 },
      );
    attempt.count++;
    attempts.set(key, attempt);
    if (attempts.size > 1000)
      for (const [k, v] of attempts)
        if (v.until < Date.now()) attempts.delete(k);
    const { password } = await request.json();
    if (
      !process.env.COMPANION_PASSWORD ||
      typeof password !== "string" ||
      !equal(password, process.env.COMPANION_PASSWORD)
    )
      throw new Error("UNAUTHORIZED");
    attempts.delete(key);
    (await cookies()).set(COOKIE, issueSession(), {
      httpOnly: true,
      sameSite: "strict",
      secure: (process.env.COMPANION_ORIGIN || "").startsWith("https:"),
      path: "/",
      maxAge: 604800,
    });
    return Response.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
