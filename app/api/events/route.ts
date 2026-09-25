import { isDemo } from "@/lib/mode";
import { equal, fail } from "@/lib/auth";
import { ingestEvent, readState } from "@/lib/store.mjs";
function authorize(request: Request) {
  if (isDemo || process.env.VERCEL) throw new Error("UNAUTHORIZED");
  const token = process.env.COMPANION_INGEST_TOKEN;
  if (
    !token ||
    !equal(request.headers.get("authorization") || "", `Bearer ${token}`)
  )
    throw new Error("UNAUTHORIZED");
}
export async function POST(request: Request) {
  try {
    authorize(request);
    return Response.json(ingestEvent(await request.json()));
  } catch (e) {
    return fail(e);
  }
}
export async function GET(request: Request) {
  try {
    authorize(request);
    return Response.json(readState());
  } catch (e) {
    return fail(e);
  }
}
