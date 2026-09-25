"use client";
import { readApiResponse } from "@/lib/api-response.mjs";
import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink, Loader2, LogIn, X } from "lucide-react";
type Account = {
  available: boolean;
  connected: boolean;
  email?: string;
  plan?: string;
  login: null | {
    verificationUrl: string;
    userCode: string;
    expiresAt: number;
  };
  error?: string | null;
};
export default function ChatGPTConnection() {
  const [account, setAccount] = useState<Account | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pollError, setPollError] = useState("");
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      try {
        const response = await fetch("/api/account", {
          cache: "no-store",
        });
        if (!response.ok)
          throw new Error("Could not check your ChatGPT connection.");
        const data = await readApiResponse(response);
        if (alive) {
          setAccount(data);
          setPollError("");
        }
      } catch (e) {
        if (alive) setPollError((e as Error).message);
      }
    };
    void refresh();
    const timer = setInterval(refresh, 4000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);
  async function action(action: "login" | "cancel" | "logout") {
    setBusy(true);
    setError("");
    setCopied(false);
    try {
      const response = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await readApiResponse(response);
      if (!response.ok)
        throw new Error(data.error || "Sign-in could not start. Try again.");
      setAccount(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (account?.available === false)
    return (
      <div className="account-card">
        <p>Connect ChatGPT on your live Instinct Companion.</p>
        <a href="https://example.com" target="_blank" rel="noreferrer">
          Open Instinct Companion on your box <ExternalLink size={13} />
        </a>
      </div>
    );
  return (
    <section className="account-card" aria-label="ChatGPT connection">
      {account?.connected ? (
        <>
          <button
            className="account-summary"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
          >
            <Check size={14} /> ChatGPT connected
          </button>
          {expanded && (
            <div>
              <p>
                {account.email}
                {account.plan ? ` · ${account.plan}` : ""}
              </p>
              <button
                className="account-text-button"
                disabled={busy}
                onClick={() => void action("logout")}
              >
                Disconnect ChatGPT
              </button>
            </div>
          )}
        </>
      ) : account?.login ? (
        <>
          <strong>Finish connecting ChatGPT</strong>
          <p>
            Copy this code, open OpenAI, and sign in with your ChatGPT account.
          </p>
          <div className="device-code">
            <code>{account.login.userCode}</code>
            <button
              aria-label="Copy sign-in code"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(account.login!.userCode);
                  setCopied(true);
                } catch {
                  setError("Select and copy the code above.");
                }
              }}
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
            </button>
          </div>
          <a
            className="primary"
            href={account.login.verificationUrl}
            target="_blank"
            rel="noreferrer"
          >
            Continue to OpenAI <ExternalLink size={14} />
          </a>
          <p className="account-waiting">
            <Loader2 size={12} className="spin" /> Waiting for sign-in…
          </p>
          <button
            className="account-text-button"
            disabled={busy}
            onClick={() => void action("cancel")}
          >
            <X size={12} /> Cancel sign-in
          </button>
        </>
      ) : (
        <>
          <strong>Your agent, with ChatGPT.</strong>
          <p>Connect your account to create and change your dashboards here.</p>
          <button
            className="primary"
            disabled={busy || !account}
            onClick={() => void action("login")}
          >
            {busy ? (
              <Loader2 size={15} className="spin" />
            ) : (
              <LogIn size={15} />
            )}{" "}
            {busy ? "Starting sign-in…" : "Sign in with ChatGPT"}
          </button>
        </>
      )}
      {(error || pollError || account?.error) && (
        <p className="account-error" role="alert">
          {error || pollError || account?.error}
        </p>
      )}
    </section>
  );
}
