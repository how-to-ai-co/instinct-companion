import { guard, fail } from "@/lib/auth";
import { restore } from "@/lib/store.mjs";
export async function POST(request: Request) {
  try {
    await guard(request);
    const body = await request.json();
    return Response.json(restore(body.id, body.revision));
  } catch (e) {
    return fail(e);
  }
}
