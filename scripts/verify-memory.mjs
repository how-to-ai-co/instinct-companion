// Opt-in integration verification against your configured deployment; only writes verify-* records.
import assert from "node:assert/strict";
const base = process.env.COMPANION_TEST_URL;
const key = process.env.COMPANION_INGEST_TOKEN;
if (!base || !key)
  throw new Error("Set COMPANION_TEST_URL and COMPANION_INGEST_TOKEN.");
const endpoint = new URL("/api/memory", base);
async function request(body, auth = true) {
  const r = await fetch(endpoint, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      "Content-Type": "application/json",
      ...(auth ? { Authorization: `Bearer ${key}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: r.status, data: await r.json() };
}
const records = [
  "link",
  "list",
  "reminder",
  "task",
  "project",
  "note",
  "fact",
].map((type) => ({
  id: `verify-${type}`,
  version: 1,
  type,
  title: `Verification ${type}`,
  text: "Temporary integration test. No personal information.",
  ...(type === "link" ? { url: "https://example.com" } : {}),
  ...(type === "reminder" ? { dueAt: "2026-10-01T15:00:00Z" } : {}),
  ...(type !== "project" ? { projectId: "verify-project" } : {}),
  ...(type === "list"
    ? {
        items: [
          { id: "first", text: "Check persistence", done: true },
          { id: "second", text: "Check views", done: false },
        ],
      }
    : {}),
}));
const event = {
  eventId: "verify-initial",
  message: "Temporary API verification",
  records,
};
assert.equal((await request(event, false)).status, 401);
const result = await request(event);
assert.equal(result.status, 200, JSON.stringify(result.data));
assert.equal(result.data.applied, 7);
assert.equal((await request(event)).data.duplicate, true);
assert.equal((await request({ ...event, message: "Changed" })).status, 409);
assert.equal(
  (
    await request({
      eventId: "verify-invalid",
      records: [{ ...records[0], url: "javascript:alert(1)" }],
    })
  ).status,
  400,
);
const task = { ...records[3], version: 2, status: "done" };
assert.equal(
  (await request({ eventId: "verify-update", records: [task] })).data.applied,
  1,
);
assert.equal(
  (await request({ eventId: "verify-late", records: [records[3]] })).data
    .applied,
  0,
);
const read = await request();
assert.equal(read.status, 200);
assert.equal(
  read.data.records.filter((r) => r.id.startsWith("verify-")).length,
  7,
);
assert.equal(
  read.data.records.find((r) => r.id === "verify-task").status,
  "done",
);
const concurrent = await Promise.all([
  request({
    eventId: "verify-parallel",
    records: [{ ...records[5], version: 2, title: "Updated note" }],
  }),
  request({
    eventId: "verify-parallel",
    records: [{ ...records[5], version: 2, title: "Updated note" }],
  }),
]);
assert.equal(concurrent.filter((r) => r.data.duplicate).length, 1);
assert.equal(
  (
    await request({
      eventId: "verify-rollback",
      records: [
        { ...records[6], version: 2, title: "Should roll back" },
        { ...records[5], version: 2, title: "Conflict" },
      ],
    })
  ).status,
  409,
);
assert.equal(
  (await request()).data.records.find((r) => r.id === "verify-fact").version,
  1,
);
console.log(
  "PASS: seven types, auth, validation, persistence, retries, conflicts, stale versions, concurrency, atomic rollback.",
);
console.log(
  "Temporary verify-* records remain for browser verification; remove only those records and verify-* events afterward.",
);
