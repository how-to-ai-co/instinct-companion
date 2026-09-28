"use client";
import { useState } from "react";

export default function PublicCompanion() {
  const [page, setPage] = useState<"home" | "spaces" | "activity">("home");
  return (
    <div className="viewer">
      <header className="viewer-header">
        <a className="wordmark" href="/">Instinct Companion</a>
        <nav aria-label="Main navigation">
          {(["home", "spaces", "activity"] as const).map((name) => (
            <button key={name} aria-current={page === name ? "page" : undefined} onClick={() => setPage(name)}>{name}</button>
          ))}
        </nav>
      </header>
      <main className="viewer-main">
        <h1>{page}</h1>
        <p className="view-muted">{page === "home" ? "Nothing saved yet." : page === "spaces" ? "No spaces yet." : "No activity yet."}</p>
      </main>
    </div>
  );
}
