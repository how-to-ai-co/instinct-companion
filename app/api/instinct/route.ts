import { isDemo } from "@/lib/mode";
import { equal, fail } from "@/lib/auth";
import { agentRequest } from "@/lib/agent-transport";
import { db } from "@/lib/store.mjs";
import { z } from "zod";
export const dynamic = "force-dynamic";
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
    const input = z
      .object({
        requestId: z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/),
        message: z.string().trim().min(1).max(10000),
        workspaceId: z.string().max(80).default(""),
        mode: z.enum(["ask", "edit"]).default("edit"),
      })
      .parse(await request.json());
    return Response.json(await agentRequest("/run", "POST", input), {
      status: 202,
    });
  } catch (error) {
    return fail(error);
  }
}
export async function GET(request: Request) {
  try {
    authorize(request);
    const id = new URL(request.url).searchParams.get("runId");
    const run = id && db().prepare("SELECT * FROM runs WHERE id=?").get(id);
    if (!run) throw new Error("NOT_FOUND");
    return Response.json(run, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return fail(error);
  }
}
