import test from "node:test";
import assert from "node:assert/strict";
import { readApiResponse } from "../lib/api-response.mjs";
test("empty, truncated, proxy HTML, and invalid JSON shapes give actionable errors", async () => {
  for (const body of [
    "",
    '{"ok":',
    "<html>Bad gateway</html>",
    "null",
    '"wrong"',
    "[]",
  ]) {
    await assert.rejects(
      readApiResponse(new Response(body, { status: 200 })),
      /Instinct Companion returned/,
    );
  }
  await assert.rejects(
    readApiResponse(new Response("", { status: 502 })),
    /HTTP 502/,
  );
  await assert.rejects(
    readApiResponse(new Response("", { status: 401 })),
    /sign in again/,
  );
  await assert.rejects(
    readApiResponse(
      Response.json({ error: "This workspace changed." }, { status: 409 }),
    ),
    /workspace changed/,
  );
  assert.deepEqual(await readApiResponse(Response.json({ revision: 4 })), {
    revision: 4,
  });
});
