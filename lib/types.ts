export type Item = {
  id: string;
  title: string;
  detail: string;
  url: string;
  value: string;
  saved: boolean;
  done: boolean;
};
export type Block = {
  id: string;
  type: "note" | "checklist" | "collection" | "metric";
  title: string;
  text: string;
  value: string;
  unit: string;
  view: "cards" | "table";
  items: Item[];
};
export type Workspace = {
  id: string;
  title: string;
  description: string;
  icon: "sparkles" | "bike" | "calendar" | "activity" | "folder";
  blocks: Block[];
  updatedAt: string;
};
export type Snapshot = { revision: number; workspaces: Workspace[] };
export type Run = {
  id: string;
  workspaceId: string;
  message: string;
  status: string;
  reply: string | null;
  createdAt: string;
  remoteId: string | null;
  mode: "ask" | "edit";
};
export type History = { id: number; label: string; createdAt: string };
