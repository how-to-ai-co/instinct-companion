import { db } from "./store.mjs";
function table() {
  db().exec(
    "CREATE TABLE IF NOT EXISTS token_usage (runId TEXT PRIMARY KEY, input INTEGER NOT NULL, output INTEGER NOT NULL, cached INTEGER NOT NULL, total INTEGER NOT NULL, recordedAt TEXT NOT NULL)",
  );
}
export function recordUsage(runId, usage) {
  const values = [
    "inputTokens",
    "outputTokens",
    "cachedInputTokens",
    "totalTokens",
  ].map((k) => usage?.[k]);
  if (!values.every((v) => Number.isSafeInteger(v) && v >= 0)) return;
  table();
  db()
    .prepare(
      "INSERT INTO token_usage VALUES (?,?,?,?,?,?) ON CONFLICT(runId) DO UPDATE SET input=excluded.input, output=excluded.output, cached=excluded.cached,total=excluded.total,recordedAt=excluded.recordedAt",
    )
    .run(runId, ...values, new Date().toISOString());
}
export function usageSummary() {
  table();
  return db()
    .prepare(
      "SELECT COUNT(*) AS runs, COALESCE(SUM(input),0) AS input, COALESCE(SUM(output),0) AS output, COALESCE(SUM(cached),0) AS cached, COALESCE(SUM(total),0) AS total, MIN(recordedAt) AS since FROM token_usage",
    )
    .get();
}
