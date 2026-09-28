import test from "node:test";
import assert from "node:assert/strict";
import { eventSchema } from "../lib/memory-schema.mjs";
const record = { id: "one", version: 1, type: "note", title: "A note" };
test("all seven memory types validate, including list completion and project relationships", () => {
  for (const type of [
    "link",
    "list",
    "reminder",
    "task",
    "project",
    "note",
    "fact",
  ]) {
    const r = {
      ...record,
      type,
      url: "https://example.com",
      dueAt: "2026-10-01T12:00:00Z",
      projectId: "project",
      items: [{ id: "item", text: "Pack a bag", done: true }],
    };
    assert.equal(
      eventSchema.parse({ eventId: type, records: [r] }).records[0].type,
      type,
    );
  }
});
test("rejects executable URLs, missing reminder dates, duplicate IDs and unknown fields", () => {
  for (const records of [
    [{ ...record, type: "link", url: "javascript:alert(1)" }],
    [{ ...record, type: "reminder" }],
    [record, record],
    [{ ...record, html: "<script>" }],
    [{ ...record, version: 0 }],
  ]) {
    assert.equal(
      eventSchema.safeParse({ eventId: "event", records }).success,
      false,
    );
  }
});
test("raw messages can be recorded without pretending to infer their meaning", () => {
  assert.equal(
    eventSchema.parse({ eventId: "message", message: "Remember this" }).records
      .length,
    0,
  );
  assert.equal(eventSchema.safeParse({ eventId: "empty" }).success, false);
});
