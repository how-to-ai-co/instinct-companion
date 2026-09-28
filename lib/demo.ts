const demoState = { revision: 1, workspaces: [] };
export function demoResponse(path: string, body?: unknown): any {
  if (body !== undefined)
    throw new Error(
      "This is a viewing demo. Connect your own agent in a self-hosted installation to make changes.",
    );
  if (path === "state")
    return {
      ...demoState,
      receipts: { requests: 0, lastRequestAt: null },
      usage: { runs: 0, total: 0, input: 0, output: 0, cached: 0 },
    };
  if (path === "agent")
    return { connection: { connected: false, label: "Demo only" }, runs: [] };
  if (path === "presentation")
    return { revision: 1, status: "Demo — no inference", scores: {} };
  throw new Error("Unavailable in the public demo.");
}
