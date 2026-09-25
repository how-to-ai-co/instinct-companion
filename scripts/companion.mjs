#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { readState, saveWorkspace, history, restore } from "../lib/store.mjs";
const [command, file] = process.argv.slice(2);
try {
  if (command === "read") console.log(JSON.stringify(readState(), null, 2));
  else if (command === "save") {
    const input = JSON.parse(readFileSync(file, "utf8"));
    console.log(
      JSON.stringify(
        saveWorkspace(
          input.workspace,
          input.revision,
          input.label || "Updated by Instinct Companion",
        ),
      ),
    );
  } else if (command === "history")
    console.log(JSON.stringify(history(), null, 2));
  else if (command === "restore")
    console.log(JSON.stringify(restore(Number(file), readState().revision)));
  else
    throw new Error(
      "Use: read | save <json-file> | history | restore <history-id>",
    );
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
}
