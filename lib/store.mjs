import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { z } from "zod";

const id = z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/);
const text = z.string().max(20000);
const safeUrl = z
  .string()
  .max(2000)
  .refine((v) => !v || /^https?:\/\//i.test(v), "Links must use http or https");
export const itemSchema = z.object({
  id,
  title: z.string().max(300),
  detail: text.default(""),
  url: safeUrl.default(""),
  value: z.string().max(100).default(""),
  saved: z.boolean().default(false),
  done: z.boolean().default(false),
});
export const blockSchema = z.object({
  id,
  type: z.enum(["note", "checklist", "collection", "metric"]),
  title: z.string().max(200),
  text: text.default(""),
  value: z.string().max(100).default(""),
  unit: z.string().max(100).default(""),
  view: z.enum(["cards", "table"]).default("cards"),
  items: z.array(itemSchema).max(500).default([]),
});
export const workspaceSchema = z
  .object({
    id,
    title: z.string().trim().min(1).max(100),
    description: z.string().max(1000).default(""),
    icon: z
      .enum(["sparkles", "bike", "calendar", "activity", "folder"])
      .default("folder"),
    blocks: z.array(blockSchema).max(40),
    updatedAt: z.string().default(""),
  })
  .refine(
    (w) => new Set(w.blocks.map((b) => b.id)).size === w.blocks.length,
    "Block IDs must be unique",
  )
  .refine(
    (w) =>
      w.blocks.every(
        (b) => new Set(b.items.map((i) => i.id)).size === b.items.length,
      ),
    "Item IDs must be unique",
  );
const stateSchema = z
  .object({
    revision: z.number().int().nonnegative(),
    workspaces: z.array(workspaceSchema).max(100),
  })
  .refine(
    (s) => new Set(s.workspaces.map((w) => w.id)).size === s.workspaces.length,
    "Workspace IDs must be unique",
  );
let database;
export function db() {
  if (database) return database;
  const file = resolve(
    process.env.COMPANION_DATA_DIR || ".data",
    "companion.sqlite",
  );
  mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
  database = new DatabaseSync(file);
  database.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;");
  database.exec(`CREATE TABLE IF NOT EXISTS state (id INTEGER PRIMARY KEY CHECK(id=1), body TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS history (id INTEGER PRIMARY KEY AUTOINCREMENT, body TEXT NOT NULL, label TEXT NOT NULL, createdAt TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS runs (id TEXT PRIMARY KEY, workspaceId TEXT NOT NULL, message TEXT NOT NULL, mode TEXT NOT NULL, status TEXT NOT NULL, remoteId TEXT, reply TEXT, createdAt TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, createdAt TEXT NOT NULL);`);
  database
    .prepare("INSERT OR IGNORE INTO state VALUES (1, ?)")
    .run(JSON.stringify({ revision: 0, workspaces: [] }));
  return database;
}
export function readState() {
  return JSON.parse(
    db().prepare("SELECT body FROM state WHERE id=1").get().body,
  );
}
let depth = 0;
function transaction(fn) {
  if (depth) return fn();
  db().exec("BEGIN IMMEDIATE");
  depth++;
  try {
    const value = fn();
    db().exec("COMMIT");
    return value;
  } catch (error) {
    db().exec("ROLLBACK");
    throw error;
  } finally {
    depth--;
  }
}
export function changeState(expectedRevision, label, change) {
  return transaction(() => {
    const before = readState();
    if (expectedRevision !== before.revision) throw new Error("CONFLICT");
    const next = stateSchema.parse(change(structuredClone(before)));
    next.revision = before.revision + 1;
    db()
      .prepare("INSERT INTO history(body,label,createdAt) VALUES (?,?,?)")
      .run(
        JSON.stringify(before),
        label.slice(0, 200),
        new Date().toISOString(),
      );
    db()
      .prepare("UPDATE state SET body=? WHERE id=1")
      .run(JSON.stringify(next));
    db()
      .prepare(
        "DELETE FROM history WHERE id NOT IN (SELECT id FROM history ORDER BY id DESC LIMIT 50)",
      )
      .run();
    return next;
  });
}
export function saveWorkspace(input, revision, label = "Updated workspace") {
  const workspace = workspaceSchema.parse({
    ...input,
    updatedAt: new Date().toISOString(),
  });
  return changeState(revision, label, (state) => {
    const index = state.workspaces.findIndex((w) => w.id === workspace.id);
    if (index < 0) state.workspaces.push(workspace);
    else state.workspaces[index] = workspace;
    return state;
  });
}
export function history() {
  return db()
    .prepare("SELECT id,label,createdAt FROM history ORDER BY id DESC LIMIT 25")
    .all();
}
export function restore(historyId, revision) {
  const row = db()
    .prepare("SELECT body FROM history WHERE id=?")
    .get(historyId);
  if (!row) throw new Error("NOT_FOUND");
  return changeState(revision, "Restored an earlier layout", () =>
    JSON.parse(row.body),
  );
}
export function listRuns() {
  return db()
    .prepare("SELECT * FROM runs ORDER BY createdAt DESC LIMIT 40")
    .all();
}
export function createRun(workspaceId, message, mode) {
  const run = {
    id: randomUUID(),
    workspaceId,
    message,
    mode,
    status: "submitting",
    createdAt: new Date().toISOString(),
  };
  db()
    .prepare(
      "INSERT INTO runs(id,workspaceId,message,mode,status,createdAt) VALUES (@id,@workspaceId,@message,@mode,@status,@createdAt)",
    )
    .run(run);
  return run;
}
export function updateRun(id, status, remoteId, reply) {
  db()
    .prepare("UPDATE runs SET status=?, remoteId=?,reply=? WHERE id=?")
    .run(status, remoteId, reply, id);
}
export function ingestEvent(input) {
  const event = z
    .object({ eventId: id, workspaceId: id, blockId: id, item: itemSchema })
    .parse(input);
  return transaction(() => {
    if (db().prepare("SELECT id FROM events WHERE id=?").get(event.eventId))
      return { duplicate: true, revision: readState().revision };
    const state = readState();
    const workspace = state.workspaces.find((w) => w.id === event.workspaceId);
    const block = workspace?.blocks.find((b) => b.id === event.blockId);
    if (!block || !["collection", "checklist"].includes(block.type))
      throw new Error("NOT_FOUND");
    const existing = block.items.findIndex((i) => i.id === event.item.id);
    if (existing < 0) block.items.push(event.item);
    else
      block.items[existing] = {
        ...event.item,
        saved: block.items[existing].saved,
        done: block.items[existing].done,
      };
    const next = saveWorkspace(workspace, state.revision, "Received an update");
    db()
      .prepare("INSERT INTO events VALUES (?,?)")
      .run(event.eventId, new Date().toISOString());
    return { duplicate: false, revision: next.revision };
  });
}

export function deliveryReceipts() {
  const items = db()
    .prepare("SELECT COUNT(*) AS count, MAX(createdAt) AS latest FROM events")
    .get();
  const hasRequests = db()
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='agent_requests'",
    )
    .get();
  const requests = hasRequests
    ? db()
        .prepare(
          "SELECT COUNT(*) AS count, MAX(r.createdAt) AS latest FROM agent_requests a JOIN runs r ON r.id=a.runId",
        )
        .get()
    : { count: 0, latest: null };
  return {
    items: items.count,
    lastItemAt: items.latest,
    requests: requests.count,
    lastRequestAt: requests.latest,
  };
}
