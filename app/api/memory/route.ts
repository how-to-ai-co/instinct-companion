import { hasKey, rpc, memoryError } from "@/lib/memory";
import { eventSchema } from "@/lib/memory-schema.mjs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (process.env.COMPANION_PUBLIC_READ !== "true" && !hasKey(request))
    return Response.json(
      { error: "Reading this installation requires authorization." },
      { status: 401 },
    );
  try {
    return Response.json(await rpc("companion_snapshot"), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return memoryError(e);
  }
}
export async function POST(request: Request) {
  if (!hasKey(request))
    return Response.json(
      { error: "A valid integration bearer token is required." },
      { status: 401 },
    );
  if (!request.headers.get("content-type")?.includes("application/json"))
    return Response.json({ error: "Send application/json." }, { status: 415 });
  try {
    const reader = request.body?.getReader();
    if (!reader)
      return Response.json({ error: "Missing body" }, { status: 400 });
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 262144) {
        await reader.cancel();
        return Response.json(
          { error: "Delivery exceeds 256 KB." },
          { status: 413 },
        );
      }
      chunks.push(value);
    }
    let input;
    try {
      input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      return Response.json({ error: "Invalid JSON." }, { status: 400 });
    }
    const parsed = eventSchema.safeParse(input);
    if (!parsed.success)
      return Response.json(
        { error: "Invalid delivery.", issues: parsed.error.issues },
        { status: 400 },
      );
    return Response.json(
      await rpc("companion_ingest", { event: parsed.data }),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return memoryError(e);
  }
}
