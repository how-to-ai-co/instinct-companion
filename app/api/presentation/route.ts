import { guard, fail } from "@/lib/auth";
import { presentation } from "@/lib/jev.mjs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await guard();
    return Response.json(await presentation(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return fail(error);
  }
}
