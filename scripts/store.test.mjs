import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const dir = mkdtempSync(join(tmpdir(), "companion-test-"));
process.env.COMPANION_DATA_DIR = dir;
const { readState, saveWorkspace, history, restore, ingestEvent, db } =
  await import("../lib/store.mjs");
const workspace = {
  id: "bikes",
  title: "Bike search",
  blocks: [{ id: "listings", type: "collection", title: "Listings" }],
};
test("workspace changes are validated, conflict-safe, reversible, and ingest is idempotent", () => {
  assert.equal(readState().workspaces.length, 0);
  saveWorkspace(workspace, 0, "Create bike search");
  assert.throws(
    () => saveWorkspace({ ...workspace, title: "Stale edit" }, 0),
    /CONFLICT/,
  );
  assert.equal(readState().workspaces[0].title, "Bike search");
  assert.throws(() =>
    saveWorkspace(
      {
        ...workspace,
        blocks: [{ id: "bad", type: "iframe", title: "Unsafe widget" }],
      },
      1,
    ),
  );
  assert.equal(readState().revision, 1);
  const event = {
    eventId: "event-1",
    workspaceId: "bikes",
    blockId: "listings",
    item: {
      id: "bike-1",
      title: "Owner-supplied bike",
      url: "https://example.com/bike",
      value: "$500",
      saved: true,
    },
  };
  assert.equal(ingestEvent(event).duplicate, false);
  const afterFirst = readState().revision;
  assert.equal(ingestEvent(event).duplicate, true);
  assert.equal(readState().revision, afterFirst);
  ingestEvent({
    ...event,
    eventId: "event-2",
    item: { ...event.item, value: "$450", saved: false },
  });
  const item = readState().workspaces[0].blocks[0].items[0];
  assert.equal(item.value, "$450");
  assert.equal(item.saved, true);
  assert.throws(() =>
    ingestEvent({
      ...event,
      eventId: "unsafe",
      item: { ...event.item, url: "javascript:alert(1)" },
    }),
  );
  assert.throws(
    () => ingestEvent({ ...event, eventId: "missing", blockId: "missing" }),
    /NOT_FOUND/,
  );
  assert.equal(
    db().prepare("SELECT count(*) AS count FROM events").get().count,
    2,
  );
  const previous = history()[0];
  restore(previous.id, readState().revision);
  assert.equal(readState().workspaces[0].blocks[0].items[0].value, "$500");
  assert.throws(() =>
    saveWorkspace(
      { ...workspace, blocks: [...workspace.blocks, ...workspace.blocks] },
      readState().revision,
    ),
  );
  db().close();
  rmSync(dir, { recursive: true, force: true });
});
