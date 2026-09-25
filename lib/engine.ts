import { agentRequest } from "./agent-transport";
import { listRuns } from "./store.mjs";
export async function status() {
  try {
    const account = await agentRequest("/status");
    return { connected: account.connected, label: account.label };
  } catch {
    return { connected: false, label: "Agent unavailable" };
  }
}
export async function submit(
  message: string,
  workspaceId: string,
  mode: "ask" | "edit",
) {
  return agentRequest("/run", "POST", { message, workspaceId, mode });
}
export async function syncRuns() {
  return listRuns();
}
