import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const dir = mkdtempSync(join(tmpdir(), "companion-jev-"));
process.env.COMPANION_DATA_DIR = dir;
const { db, saveWorkspace } = await import("../lib/store.mjs");
const { presentation } = await import("../lib/jev.mjs");
test("Jev caches priorities, never changes data, and stops on unconfirmed free billing", async () => {
  const oldFetch = global.fetch,
    oldNow = Date.now,
    oldKey = process.env.AI_GATEWAY_API_KEY;
  Date.now = () => Date.parse("2026-09-20T00:00:00Z");
  try {
    delete process.env.AI_GATEWAY_API_KEY;
    assert.equal((await presentation()).status, "Not connected");
    process.env.AI_GATEWAY_API_KEY = "test-only";
    saveWorkspace(
      {
        id: "home",
        title: "Home",
        blocks: [{ id: "work", title: "Work", type: "note" }],
      },
      0,
    );
    let calls = 0;
    global.fetch = async () => {
      calls++;
      return Response.json({
        answers: { section0: { score: 2.5 } },
        usage: { inputTokens: 50 },
        providerMetadata: { gateway: { cost: "0" } },
      });
    };
    const first = await presentation();
    assert.equal(first.scores.work, 2.5);
    assert.deepEqual(await presentation(), first);
    assert.equal(calls, 1);
    saveWorkspace(
      {
        id: "home",
        title: "Home",
        blocks: [{ id: "work", title: "Changed work", type: "note" }],
      },
      1,
    );
    global.fetch = async () =>
      Response.json({
        answers: { section0: { score: 2 } },
        usage: { inputTokens: 50 },
      });
    assert.match((await presentation()).status, /pricing needs review/);
    global.fetch = async () => {
      throw new Error("Should not call");
    };
    assert.match((await presentation()).status, /pricing needs review/);
    Date.now = () => Date.parse("2026-09-26T00:00:00Z");
    assert.match((await presentation()).status, /promotion ended/);
  } finally {
    global.fetch = oldFetch;
    Date.now = oldNow;
    if (oldKey) process.env.AI_GATEWAY_API_KEY = oldKey;
    else delete process.env.AI_GATEWAY_API_KEY;
    db().close();
    rmSync(dir, { recursive: true, force: true });
  }
});
