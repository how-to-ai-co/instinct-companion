import { z } from "zod";
import { readState, saveWorkspace, workspaceSchema } from "./store.mjs";

export const saveSchema = z.object({
  revision: z.number().int().nonnegative(),
  label: z.string().min(1).max(200),
  workspace: workspaceSchema,
});
export function agentTools(mode) {
  const tools = [
    {
      type: "function",
      name: "read_workspace",
      description:
        "Read the current complete workspace state and revision. Call before editing and after saving.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
  ];
  if (mode === "edit")
    tools.push({
      type: "function",
      name: "save_workspace",
      description:
        "Create or update a complete workspace with optimistic revision checking. Preserves other workspaces. If CONFLICT, re-read state and merge before retrying.",
      inputSchema: z.toJSONSchema(saveSchema, { unrepresentable: "any" }),
    });
  return tools;
}
export function executeAgentTool(mode, tool, args) {
  if (tool === "read_workspace") return readState();
  if (tool === "save_workspace") {
    if (mode !== "edit")
      throw new Error("Read-only conversations cannot change workspaces.");
    const input = saveSchema.parse(args);
    return saveWorkspace(input.workspace, input.revision, input.label);
  }
  throw new Error("Unknown Companion tool.");
}
