"use client";
import { readApiResponse } from "@/lib/api-response.mjs";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
export default function Login() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <main className="login-page">
      <form
        className="login-card"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            const password = new FormData(e.currentTarget).get("password");
            const r = await fetch("/api/session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ password }),
            });
            await readApiResponse(r);
            window.location.reload();
          } catch (e) {
            setError((e as Error).message);
            setBusy(false);
          }
        }}
      >
        <h1 className="wordmark">companion</h1>
        <p className="login-subtitle">for instinct · on your box</p>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          name="password"
          autoComplete="current-password"
          required
          autoFocus
        />
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="primary" disabled={busy}>
          {busy ? "Signing in…" : "Open Instinct Companion"}
          <ArrowUpRight size={18} />
        </button>
        <small>Running on your box. For Instinct.</small>
      </form>
    </main>
  );
}
