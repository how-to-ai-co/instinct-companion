import { z } from "zod";
const id = z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/);
const url = z
  .url()
  .refine(
    (value) => ["https:", "http:"].includes(new URL(value).protocol),
    "Use an HTTP or HTTPS link",
  );
export const recordSchema = z
  .object({
    id,
    version: z.number().int().positive().max(2147483647),
    type: z.enum([
      "link",
      "list",
      "reminder",
      "task",
      "project",
      "note",
      "fact",
    ]),
    title: z.string().trim().min(1).max(300),
    text: z.string().max(20000).default(""),
    url: url.optional(),
    projectId: id.optional(),
    dueAt: z.iso.datetime({ offset: true }).optional(),
    status: z.enum(["active", "waiting", "done", "archived"]).default("active"),
    items: z
      .array(
        z
          .object({
            id,
            text: z.string().min(1).max(2000),
            done: z.boolean().default(false),
          })
          .strict(),
      )
      .max(200)
      .default([]),
    tags: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  })
  .strict()
  .superRefine((r, ctx) => {
    if (r.type === "link" && !r.url)
      ctx.addIssue({
        code: "custom",
        message: "Links require url",
        path: ["url"],
      });
    if (r.type === "reminder" && !r.dueAt)
      ctx.addIssue({
        code: "custom",
        message: "Reminders require dueAt with timezone",
        path: ["dueAt"],
      });
    if (r.projectId === r.id)
      ctx.addIssue({
        code: "custom",
        message: "A record cannot contain itself",
        path: ["projectId"],
      });
    if (new Set(r.items.map((i) => i.id)).size !== r.items.length)
      ctx.addIssue({
        code: "custom",
        message: "List item IDs must be unique",
        path: ["items"],
      });
  });
export const eventSchema = z
  .object({
    eventId: id,
    message: z.string().max(20000).default(""),
    records: z.array(recordSchema).max(100).default([]),
  })
  .strict()
  .superRefine((e, ctx) => {
    if (!e.message.trim() && !e.records.length)
      ctx.addIssue({
        code: "custom",
        message: "Send a message or at least one record",
      });
    if (new Set(e.records.map((r) => r.id)).size !== e.records.length)
      ctx.addIssue({
        code: "custom",
        message: "Record IDs must be unique in a delivery",
      });
  });
