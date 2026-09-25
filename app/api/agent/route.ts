import { guard, fail } from "@/lib/auth";
import { status, submit, syncRuns } from "@/lib/engine";
import { z } from "zod";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await guard();
    const [connection, runs] = await Promise.all([status(), syncRuns()]);
    return Response.json({ connection, runs });
  } catch (e) {
    return fail(e);
  }
}
export async function POST(request: Request) {
  try {
    await guard(request);
    const body = z
      .object({
        message: z.string().trim().min(1).max(10000),
        workspaceId: z.string().max(80),
        mode: z.enum(["ask", "edit"]),
      })
      .parse(await request.json());
    return Response.json(
      await submit(body.message, body.workspaceId, body.mode),
    );
  } catch (e) {
    return fail(e);
  }
}
