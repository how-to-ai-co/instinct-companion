"use client";
import { useEffect, useState } from "react";
import type { MemoryRecord, MemorySnapshot } from "@/lib/memory-types";
const tabs = [
  "home",
  "links",
  "lists",
  "reminders",
  "tasks",
  "projects",
  "notes",
  "facts",
  "activity",
  "archive",
] as const;
type Tab = (typeof tabs)[number];
const types: Partial<Record<Tab, string>> = {
  links: "link",
  lists: "list",
  reminders: "reminder",
  tasks: "task",
  projects: "project",
  notes: "note",
  facts: "fact",
};
function date(s: string) {
  return new Date(s).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
function Card({
  record: r,
  project,
  onProject,
}: {
  record: MemoryRecord;
  project?: string;
  onProject: (id: string) => void;
}) {
  return (
    <article className={`memory-card memory-${r.type}`}>
      <div className="memory-meta">
        <span>{r.type}</span>
        <span>{r.status !== "active" ? r.status : ""}</span>
      </div>
      <h2>{r.title}</h2>
      {r.text && <p className="memory-text">{r.text}</p>}
      {r.url && (
        <a href={r.url} target="_blank" rel="noopener noreferrer">
          {new URL(r.url).hostname} ↗
        </a>
      )}
      {r.dueAt && (
        <p
          className={
            Date.parse(r.dueAt) < Date.now() && r.status !== "done"
              ? "memory-overdue"
              : "memory-due"
          }
        >
          <time dateTime={r.dueAt}>{date(r.dueAt)}</time>
          {Date.parse(r.dueAt) < Date.now() && r.status === "active"
            ? " · overdue"
            : ""}
        </p>
      )}
      {!!r.items.length && (
        <>
          <p className="memory-meta">
            {r.items.filter((i) => i.done).length} of {r.items.length} complete
          </p>
          <ul className="memory-list">
            {r.items.map((i) => (
              <li key={i.id}>
                <span aria-label={i.done ? "Complete" : "Incomplete"}>
                  {i.done ? "✓" : "○"}
                </span>
                <span className={i.done ? "memory-complete" : ""}>
                  {i.text}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
      {!!r.tags.length && (
        <div className="memory-tags">
          {r.tags.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      )}
      {r.projectId && (
        <button
          className="memory-project-link"
          onClick={() => onProject(r.projectId!)}
        >
          {project || "Related project"} →
        </button>
      )}
      {r.type === "project" && (
        <button className="memory-project-link" onClick={() => onProject(r.id)}>
          Open project →
        </button>
      )}
    </article>
  );
}
export default function PublicCompanion() {
  const [page, setPage] = useState<Tab>("home"),
    [project, setProject] = useState(""),
    [search, setSearch] = useState("");
  const [snapshot, setSnapshot] = useState<MemorySnapshot | null>(null),
    [error, setError] = useState(""),
    [refreshed, setRefreshed] = useState("");
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    async function refresh() {
      try {
        const r = await fetch("/api/memory", {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await r.json();
        if (!r.ok)
          throw new Error(data.error || "Could not load saved information.");
        if (!stopped) {
          setSnapshot(data);
          setError("");
          setRefreshed(new Date().toISOString());
        }
      } catch (e) {
        if (!stopped) setError((e as Error).message);
      } finally {
        if (!stopped) timer = setTimeout(refresh, 5000);
      }
    }
    void refresh();
    return () => {
      stopped = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, []);
  const records = snapshot?.records || [],
    active = records.filter((r) => !["done", "archived"].includes(r.status));
  const visible = records
    .filter((r) =>
      page === "archive"
        ? ["done", "archived"].includes(r.status)
        : !["done", "archived"].includes(r.status),
    )
    .filter((r) => !types[page] || r.type === types[page])
    .filter((r) => !project || r.projectId === project || r.id === project)
    .filter((r) =>
      `${r.title} ${r.text} ${r.tags.join(" ")} ${r.items.map((i) => i.text).join(" ")}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  const projectTitle = records.find((r) => r.id === project)?.title || project;
  function openProject(id: string) {
    setPage("home");
    setProject(id);
    setSearch("");
  }
  function cards(rows: MemoryRecord[]) {
    return (
      <div className="memory-grid">
        {rows.map((r) => (
          <Card
            key={r.id}
            record={r}
            project={records.find((p) => p.id === r.projectId)?.title}
            onProject={openProject}
          />
        ))}
      </div>
    );
  }
  const upcoming = visible
    .filter((r) => r.dueAt)
    .sort((a, b) => Date.parse(a.dueAt!) - Date.parse(b.dueAt!))
    .slice(0, 6);
  return (
    <div className="memory-app">
      <header className="memory-header">
        <a className="wordmark" href="/">
          Instinct Companion
        </a>
        <span className="memory-sync" role="status">
          {error
            ? "Updates unavailable"
            : refreshed
              ? "Up to date"
              : "Connecting…"}
        </span>
      </header>
      <nav className="memory-nav" aria-label="Views">
        {tabs.map((t) => (
          <button
            key={t}
            aria-current={page === t ? "page" : undefined}
            onClick={() => {
              setPage(t);
              setProject("");
            }}
          >
            {t}
            {types[t] && (
              <span>{active.filter((r) => r.type === types[t]).length}</span>
            )}
          </button>
        ))}
      </nav>
      <main className="memory-main">
        <div className="memory-heading">
          <div>
            <p className="memory-eyebrow">Your Instinct memory</p>
            <h1>{project ? projectTitle : page}</h1>
          </div>
          <label className="memory-search">
            Search saved information
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your memory…"
            />
          </label>
        </div>
        {project && (
          <button
            className="memory-project-link"
            onClick={() => setProject("")}
          >
            ← All information
          </button>
        )}
        {error && (
          <p role="alert" className="memory-error">
            {error}
            {snapshot ? " Showing the last received information." : ""}
          </p>
        )}
        {snapshot && snapshot.total > records.length && (
          <p className="memory-error">
            Showing the latest {records.length} of {snapshot.total} records.
            Older records remain saved in Supabase.
          </p>
        )}
        {!snapshot && !error ? (
          <p className="memory-empty">Loading saved information…</p>
        ) : page === "activity" ? (
          <div className="memory-activity">
            {snapshot?.events
              .filter((e) =>
                e.message.toLowerCase().includes(search.toLowerCase()),
              )
              .map((e) => (
                <article key={e.id}>
                  <time dateTime={e.receivedAt}>{date(e.receivedAt)}</time>
                  <p className="memory-text">
                    {e.message || "Received an update from Instinct."}
                  </p>
                  <small>
                    {e.count} record{e.count === 1 ? "" : "s"} delivered
                  </small>
                </article>
              ))}
            {!snapshot?.events.length && (
              <p className="memory-empty">No deliveries yet.</p>
            )}
          </div>
        ) : !visible.length ? (
          <div className="memory-empty">
            <h2>
              {search
                ? "No matches."
                : page === "home"
                  ? "Nothing saved yet."
                  : `No ${page} yet.`}
            </h2>
            <p>
              {search
                ? "Try another search."
                : "Information sent by your connected Instinct integration will appear here."}
            </p>
          </div>
        ) : page === "home" && !search && !project ? (
          <>
            {!!upcoming.length && (
              <section className="memory-section">
                <h2>Upcoming & overdue</h2>
                {cards(upcoming)}
              </section>
            )}
            <section className="memory-section">
              <h2>Recently updated</h2>
              {cards(visible.slice(0, 12))}
            </section>
          </>
        ) : (
          cards(
            page === "reminders"
              ? visible
                  .slice()
                  .sort((a, b) => Date.parse(a.dueAt!) - Date.parse(b.dueAt!))
              : visible,
          )
        )}
        {page === "reminders" && (
          <p className="memory-footnote">
            Saved reminder dates appear here. Notifications are handled by
            Instinct, not this app.
          </p>
        )}
      </main>
    </div>
  );
}
