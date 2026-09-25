import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const directory = mkdtempSync(join(tmpdir(), "companion-jobs-"));
process.env.COMPANION_DATA_DIR = directory;
const { queueAgentRequest, existingAgentRequest } =
  await import("../lib/agent-jobs.mjs");
const { db } = await import("../lib/store.mjs");
test("Instinct delivery retries create one agent run and reject changed payloads", () => {
  try {
    const input = {
      requestId: "delivery-1",
      message: "Create a bike dashboard",
      workspaceId: "",
      mode: "edit",
    };
    const first = queueAgentRequest(input);
    const retry = queueAgentRequest(input);
    assert.equal(first.duplicate, false);
    assert.equal(retry.duplicate, true);
    assert.equal(first.run.id, retry.run.id);
    assert.equal(existingAgentRequest(input).id, first.run.id);
    assert.throws(
      () => queueAgentRequest({ ...input, message: "Different request" }),
      /REQUEST_CONFLICT/,
    );
    assert.equal(db().prepare("SELECT COUNT(*) AS n FROM runs").get().n, 1);
  } finally {
    db().close();
    rmSync(directory, { recursive: true, force: true });
  }
});
