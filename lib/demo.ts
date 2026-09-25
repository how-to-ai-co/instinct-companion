import type { Block, Item, Workspace } from "./types";
const item = (
  id: string,
  title: string,
  detail: string,
  value = "",
  url = "",
): Item => ({ id, title, detail, value, url, saved: false, done: false });
const block = (
  id: string,
  title: string,
  type: Block["type"],
  items: Item[] = [],
  text = "",
): Block => ({
  id,
  title,
  type,
  items,
  text,
  value: "",
  unit: "",
  view: "cards",
});
const workspace = (
  id: string,
  title: string,
  description: string,
  blocks: Block[],
): Workspace => ({
  id,
  title,
  description,
  blocks,
  icon: "folder",
  updatedAt: "",
});
const demoState = {
  revision: 1,
  workspaces: [
    workspace("home", "Home", "A few things worth keeping in view.", [
      block("active", "In progress", "checklist", [
        item(
          "bike",
          "Find a commuter bike",
          "Compare two fictional options under $400.",
        ),
        item(
          "weekend",
          "Plan a weekend trip",
          "Choose a destination, then compare places to stay.",
        ),
      ]),
      block("waiting", "Waiting for a reply", "collection", [
        item(
          "seller",
          "Bike seller",
          "Example status: waiting for confirmation of frame size.",
          "Waiting",
        ),
      ]),
      block(
        "next",
        "Coming up",
        "note",
        [],
        "Illustrative plan: compare the bike options this weekend. No live calendar is connected.",
      ),
    ]),
    workspace(
      "bike-search",
      "Bike search",
      "Fictional commuter-bike search · budget under $400",
      [
        block(
          "criteria",
          "What matters",
          "note",
          [],
          "An everyday commuter bike, a comfortable fit, and a price below $400. These examples are invented for the demo.",
        ),
        block("listings", "Options to compare", "collection", [
          item(
            "listing-1",
            "City commuter",
            "Fictional listing · medium frame · source link is a placeholder.",
            "$280",
            "https://example.com/demo-bike-one",
          ),
          item(
            "listing-2",
            "Everyday hybrid",
            "Fictional listing · includes a rear rack · source link is a placeholder.",
            "$340",
            "https://example.com/demo-bike-two",
          ),
        ]),
      ],
    ),
    workspace(
      "weekend",
      "Weekend trip",
      "A second space, built around a different task.",
      [
        block(
          "idea",
          "The idea",
          "note",
          [],
          "A short getaway with time outdoors. The agent could keep destination research and booking links here once supplied.",
        ),
        block("questions", "Still to decide", "checklist", [
          item(
            "dates",
            "Pick dates",
            "No reservation or calendar event has been created.",
          ),
          item(
            "budget",
            "Set a budget",
            "Waiting for the owner’s preferences.",
          ),
        ]),
      ],
    ),
  ],
};
export function demoResponse(path: string, body?: unknown): any {
  if (body !== undefined)
    throw new Error(
      "This is a viewing demo. Connect your own agent in a self-hosted installation to make changes.",
    );
  if (path === "state")
    return {
      ...demoState,
      receipts: { requests: 0, lastRequestAt: null },
      usage: { runs: 0, total: 0, input: 0, output: 0, cached: 0 },
    };
  if (path === "agent")
    return { connection: { connected: false, label: "Demo only" }, runs: [] };
  if (path === "presentation")
    return { revision: 1, status: "Demo — no inference", scores: {} };
  throw new Error("Unavailable in the public demo.");
}
