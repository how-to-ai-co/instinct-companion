import { ImageResponse } from "next/og";
export const alt =
  "Instinct Companion App — a visual home for your agent’s work";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#fafafa",
        color: "#171717",
        width: "100%",
        height: "100%",
        padding: 70,
      }}
    >
      <div style={{ fontSize: 24, color: "#777" }}>
        HTAI · COMMUNITY CONCEPT
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ fontSize: 72, fontWeight: 700 }}>Instinct Companion</div>
        <div style={{ fontSize: 32, color: "#555" }}>
          A visual home for your agent’s work.
        </div>
      </div>
      <div style={{ fontSize: 22, color: "#7c3aed" }}>
        Talk to your agent. Browse what it finds.
      </div>
    </div>,
    size,
  );
}
