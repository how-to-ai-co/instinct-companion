import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const directory = mkdtempSync(join(tmpdir(), "companion-agent-test-"));
process.env.COMPANION_DATA_DIR = directory;
const { agentTools, executeAgentTool } = await import("../lib/agent-tools.mjs");
const { db } = await import("../lib/store.mjs");
test("agent tools enforce read-only mode, validate changes, and reject stale writes", () => {
  try {
    const state = executeAgentTool("ask", "read_workspace", {});
    const input = {
      revision: state.revision,
      label: "Agent test",
      workspace: {
        id: "agent-test",
        title: "Agent test",
        blocks: [
          {
            id: "notes",
            type: "note",
            title: "Notes",
            text: "Created by a tool",
          },
        ],
      },
    };
    assert.equal(agentTools("ask").length, 1);
    assert.equal(agentTools("edit").length, 2);
    assert.throws(
      () => executeAgentTool("ask", "save_workspace", input),
      /Read-only/,
    );
    assert.equal(
      executeAgentTool("ask", "read_workspace", {}).revision,
      state.revision,
    );
    executeAgentTool("edit", "save_workspace", input);
    const next = executeAgentTool("ask", "read_workspace", {});
    assert.equal(next.workspaces[0].blocks[0].text, "Created by a tool");
    assert.throws(
      () => executeAgentTool("edit", "save_workspace", input),
      /CONFLICT/,
    );
    assert.throws(() =>
      executeAgentTool("edit", "save_workspace", {
        ...input,
        revision: next.revision,
        workspace: {
          ...input.workspace,
          blocks: [{ id: "evil", type: "script", title: "Invalid" }],
        },
      }),
    );
    assert.throws(
      () => executeAgentTool("edit", "exec", { cmd: "echo unsafe" }),
      /Unknown/,
    );
  } finally {
    db().close();
    rmSync(directory, { recursive: true, force: true });
  }
});
