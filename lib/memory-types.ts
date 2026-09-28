export type MemoryRecord = {
  id: string;
  version: number;
  type: "link" | "list" | "reminder" | "task" | "project" | "note" | "fact";
  title: string;
  text: string;
  url?: string;
  projectId?: string;
  dueAt?: string;
  status: "active" | "waiting" | "done" | "archived";
  items: { id: string; text: string; done: boolean }[];
  tags: string[];
  updatedAt: string;
};
export type MemorySnapshot = {
  records: MemoryRecord[];
  total: number;
  events: { id: string; message: string; receivedAt: string; count: number }[];
};
