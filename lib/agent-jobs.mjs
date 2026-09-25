import { createHash } from "node:crypto";
import { db, createRun, updateRun } from "./store.mjs";
function ensureTable() {
  db().exec(
    "CREATE TABLE IF NOT EXISTS agent_requests (requestId TEXT PRIMARY KEY, digest TEXT NOT NULL, runId TEXT NOT NULL)",
  );
}
function digest(input) {
  return createHash("sha256")
    .update(JSON.stringify([input.message, input.workspaceId, input.mode]))
    .digest("hex");
}
export function existingAgentRequest(input) {
  if (!input.requestId) return null;
  ensureTable();
  const previous = db()
    .prepare("SELECT * FROM agent_requests WHERE requestId=?")
    .get(input.requestId);
  if (!previous) return null;
  if (previous.digest !== digest(input)) throw new Error("REQUEST_CONFLICT");
  return db().prepare("SELECT * FROM runs WHERE id=?").get(previous.runId);
}
export function queueAgentRequest(input) {
  ensureTable();
  db().exec("BEGIN IMMEDIATE");
  try {
    const previous = existingAgentRequest(input);
    if (previous) {
      db().exec("COMMIT");
      return { run: previous, duplicate: true };
    }
    const run = createRun(input.workspaceId, input.message, input.mode);
    updateRun(run.id, "queued", "codex:" + run.id, null);
    if (input.requestId)
      db()
        .prepare(
          "INSERT INTO agent_requests(requestId,digest,runId) VALUES (?,?,?)",
        )
        .run(input.requestId, digest(input), run.id);
    db().exec("COMMIT");
    return {
      run: { ...run, status: "queued", remoteId: "codex:" + run.id },
      duplicate: false,
    };
  } catch (e) {
    db().exec("ROLLBACK");
    throw e;
  }
}
