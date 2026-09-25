import { guard, fail } from "@/lib/auth";
import { agentRequest } from "@/lib/agent-transport";
import { z } from "zod";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await guard();
    if (!process.env.COMPANION_AGENT_SOCKET)
      return Response.json({ available: false, connected: false, login: null });
    return Response.json(await agentRequest("/status"), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return fail(error);
  }
}
export async function POST(request: Request) {
  try {
    await guard(request);
    const { action } = z
      .object({ action: z.enum(["login", "cancel", "logout"]) })
      .parse(await request.json());
    return Response.json(
      await agentRequest(
        action === "logout" ? "/logout" : "/login",
        action === "cancel" ? "DELETE" : "POST",
      ),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return fail(error);
  }
}
