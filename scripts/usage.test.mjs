import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const dir = mkdtempSync(join(tmpdir(), "companion-usage-"));
process.env.COMPANION_DATA_DIR = dir;
const { recordUsage, usageSummary } = await import("../lib/usage.mjs");
const { db } = await import("../lib/store.mjs");
test("cumulative thread usage replaces prior counts, does not double count cached input, survives repeat notifications", () => {
  assert.equal(usageSummary().runs, 0);
  const u = {
    inputTokens: 100,
    outputTokens: 20,
    cachedInputTokens: 50,
    totalTokens: 120,
  };
  recordUsage("a", u);
  recordUsage("a", u);
  recordUsage("a", { ...u, inputTokens: 150, totalTokens: 170 });
  recordUsage("b", u);
  recordUsage("bad", { ...u, inputTokens: -1 });
  const s = usageSummary();
  assert.equal(s.runs, 2);
  assert.equal(s.input, 250);
  assert.equal(s.total, 290);
  assert.equal(s.cached, 100);
  db().close();
  rmSync(dir, { recursive: true, force: true });
});
