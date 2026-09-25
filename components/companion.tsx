"use client";
import { isDemo } from "@/lib/mode";
import { demoResponse } from "@/lib/demo";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowUp,
  ArrowUpRight,
  Check,
  Loader2,
  MessageCircle,
  X,
} from "lucide-react";
import ChatGPTConnection from "./chatgpt-connection";
import { readApiResponse } from "@/lib/api-response.mjs";
import type { Block, Run, Snapshot, Workspace } from "@/lib/types";
import "./viewer.css";

async function api(path: string, body?: unknown) {
  if (isDemo) return demoResponse(path, body);
  const response = await fetch(
    `/api/${path}`,
    body === undefined
      ? { cache: "no-store" }
      : {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
  );
  if (response.status === 401) window.location.reload();
  return readApiResponse(response);
}
function Content({ block }: { block: Block }) {
  return (
    <section className={`view-block view-${block.type}`}>
      <h2>{block.title}</h2>
      {block.type === "metric" ? (
        <p className="view-number">
          {block.value || "—"} <small>{block.unit}</small>
        </p>
      ) : null}
      {block.text ? <p className="view-prose">{block.text}</p> : null}
      {block.items.length > 0 ? (
        <ul className="view-items">
          {block.items.map((item) => (
            <li key={item.id}>
              <div>
                <h3>
                  {item.done ? (
                    <Check size={14} aria-label="Completed" />
                  ) : null}
                  {item.title}
                </h3>
                {item.detail ? <p>{item.detail}</p> : null}
                {item.url ? (
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    View source <ArrowUpRight size={13} />
                  </a>
                ) : null}
              </div>
              {item.value ? (
                <span className="view-value">{item.value}</span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      {!block.text && !block.value && !block.items.length ? (
        <p className="view-muted">Nothing here yet.</p>
      ) : null}
    </section>
  );
}
export default function Companion() {
  const [state, setState] = useState<Snapshot | null>(null);
  const [page, setPage] = useState<"home" | "spaces" | "activity">("home");
  const [selected, setSelected] = useState("");
  const [panel, setPanel] = useState(false);
  const [runs, setRuns] = useState<Run[]>([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [refreshError, setRefreshError] = useState("");
  const [connected, setConnected] = useState(false);
  const [receipts, setReceipts] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [presentation, setPresentation] = useState<any>(null);
  const refresh = useCallback(async () => {
    const [data, agent] = await Promise.all([api("state"), api("agent")]);
    setState(data);
    setReceipts(data.receipts);
    setUsage(data.usage);
    setRuns(agent.runs);
    setConnected(agent.connection.connected);
    setRefreshError("");
  }, []);
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        if (!stopped) await refresh();
      } catch (e) {
        if (!stopped) setRefreshError((e as Error).message);
      }
      if (!stopped) timer = setTimeout(tick, 5000);
    };
    void tick();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [refresh]);
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const check = async () => {
      try {
        const result = await api("presentation");
        if (!stopped) {
          setPresentation(result);
          if (result.status === "Evaluating") timer = setTimeout(check, 2000);
        }
      } catch {
        if (!stopped) setPresentation({ status: "unavailable" });
      }
    };
    if (state) void check();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [state?.revision]);
  const home = state?.workspaces.find((w) => w.id === "home");
  const spaces = state?.workspaces.filter((w) => w.id !== "home") || [];
  const workspace: Workspace | undefined =
    page === "home" ? home : spaces.find((w) => w.id === selected);
  const blocks = workspace?.blocks.slice() || [];
  if (
    page === "home" &&
    presentation?.revision === state?.revision &&
    presentation?.scores
  )
    blocks.sort(
      (a, b) =>
        (presentation.scores[b.id] || 0) - (presentation.scores[a.id] || 0),
    );
  async function send() {
    if (!message.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      await api("agent", {
        message,
        workspaceId: workspace?.id || "",
        mode: "edit",
      });
      setMessage("");
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  }
  return (
    <div className={`viewer ${panel ? "viewer-chat-open" : ""}`}>
      <header className="viewer-header">
        <a className="wordmark" href="/">
          Instinct Companion
        </a>
        <nav aria-label="Main navigation">
          {(["home", "spaces", "activity"] as const).map((p) => (
            <button
              key={p}
              aria-current={page === p ? "page" : undefined}
              onClick={() => {
                setPage(p);
                setSelected("");
              }}
            >
              {p}
            </button>
          ))}
        </nav>
        <div className="viewer-account">
          {isDemo ? (
            <span className="demo-badge">Fictional demo</span>
          ) : (
            <ChatGPTConnection />
          )}
        </div>
        <button
          className="viewer-chat-toggle"
          aria-label="Open Instinct Companion chat"
          aria-expanded={panel}
          onClick={() => setPanel(!panel)}
        >
          <MessageCircle size={17} />
        </button>
      </header>
      <main className="viewer-main">
        {isDemo ? (
          <div className="demo-intro">
            <p>
              A visual home for your agent’s work. All examples are fictional;
              this demo has no connected accounts.
            </p>
            <a
              href="https://github.com/how-to-ai-co/instinct-companion"
              target="_blank"
              rel="noreferrer"
            >
              View the source & concept ↗
            </a>
          </div>
        ) : null}
        {error || refreshError ? (
          <p role="alert" className="viewer-error">
            {error || refreshError}
          </p>
        ) : null}
        {!state ? (
          <p className="view-muted">Opening Instinct Companion…</p>
        ) : page === "activity" ? (
          <>
            <p className="viewer-kicker">Behind the scenes</p>
            <h1>activity</h1>
            <div className="viewer-stats">
              <section>
                <h2>ChatGPT tokens</h2>
                <strong>
                  {usage?.runs
                    ? Number(usage.total).toLocaleString()
                    : "Not recorded yet"}
                </strong>
                <p>Since tracking began. Earlier conversations are excluded.</p>
                {usage?.runs ? (
                  <p>
                    {Number(usage.input).toLocaleString()} input ·{" "}
                    {Number(usage.output).toLocaleString()} output ·{" "}
                    {Number(usage.cached).toLocaleString()} cached input
                  </p>
                ) : null}
              </section>
              <section>
                <h2>Prioritization</h2>
                <strong>{presentation?.status || "Checking"}</strong>
                <p>Prioritizes Home sections. Generates no UI code.</p>
                {typeof presentation?.inputTokens === "number" ? (
                  <p>
                    {presentation.inputTokens.toLocaleString()} input tokens in
                    latest evaluation
                  </p>
                ) : null}
              </section>
              <section>
                <h2>API deliveries</h2>
                <strong>{receipts?.requests ?? 0} requests received</strong>
                <p>
                  {receipts?.lastRequestAt
                    ? new Date(receipts.lastRequestAt).toLocaleString()
                    : "Waiting for a delivery"}
                </p>
                <p>Continuous conversation forwarding is not configured.</p>
              </section>
            </div>
            <div className="viewer-activity">
              {runs.map((r) => (
                <details key={r.id}>
                  <summary>
                    <span>
                      {r.reply?.split("\n")[0] || "Instinct Companion request"}
                    </span>
                    <small>{r.status}</small>
                  </summary>
                  <p>{r.message}</p>
                  <p>{r.reply}</p>
                </details>
              ))}
            </div>
          </>
        ) : page === "spaces" && !workspace ? (
          <>
            <p className="viewer-kicker">Your ongoing threads</p>
            <h1>spaces</h1>
            <div className="viewer-spaces">
              {spaces.map((w) => (
                <button key={w.id} onClick={() => setSelected(w.id)}>
                  <span>
                    <h2>{w.title}</h2>
                    <p>{w.description}</p>
                  </span>
                  <ArrowUpRight size={18} />
                </button>
              ))}
            </div>
            {!spaces.length ? (
              <p className="view-muted">
                Your spaces will appear as Instinct Companion organizes
                information from Instinct.
              </p>
            ) : null}
          </>
        ) : (
          <>
            <p className="viewer-kicker">
              {page === "home"
                ? "Your world, at a glance"
                : "Your ongoing threads"}
            </p>
            <h1>{page === "home" ? "home" : workspace?.title}</h1>
            {workspace?.description ? (
              <p className="viewer-description">{workspace.description}</p>
            ) : null}
            <div className="viewer-content">
              {blocks.map((b) => (
                <Content key={b.id} block={b} />
              ))}
            </div>
            {!blocks.length ? (
              <p className="view-muted">
                Instinct Companion is waiting for context from Instinct. Your
                overview will appear here.
              </p>
            ) : null}
            {page === "home" && spaces.length > 0 ? (
              <section className="viewer-related">
                <h2>Explore your spaces</h2>
                {spaces.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => {
                      setPage("spaces");
                      setSelected(w.id);
                    }}
                  >
                    {w.title}
                    <ArrowUpRight size={14} />
                  </button>
                ))}
              </section>
            ) : null}
          </>
        )}
      </main>
      {panel ? (
        <aside className="viewer-chat" aria-label="Instinct Companion chat">
          <header>
            <span className="wordmark">Instinct Companion</span>
            <button
              aria-label="Close Instinct Companion chat"
              onClick={() => setPanel(false)}
            >
              <X size={17} />
            </button>
          </header>
          <div className="viewer-messages">
            {isDemo ? (
              <p>
                This public demo has no live agent. In your own installation,
                connect Codex with your ChatGPT account to organize your
                information through conversation.
              </p>
            ) : null}
            {runs
              .slice()
              .reverse()
              .filter((r) => !workspace || r.workspaceId === workspace.id)
              .map((r) => (
                <div key={r.id}>
                  <details>
                    <summary>You</summary>
                    <p>{r.message}</p>
                  </details>
                  <p>
                    {r.reply ||
                      (r.status === "failed" ? "Request failed." : "Working…")}
                  </p>
                </div>
              ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <textarea
              aria-label="Message Instinct Companion"
              placeholder="Tell Instinct Companion…"
              value={message}
              rows={2}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <button
              aria-label="Send to Instinct Companion"
              disabled={!message.trim() || sending || !connected}
            >
              {sending ? (
                <Loader2 size={16} className="spin" />
              ) : (
                <ArrowUp size={17} />
              )}
            </button>
          </form>
        </aside>
      ) : null}
    </div>
  );
}
