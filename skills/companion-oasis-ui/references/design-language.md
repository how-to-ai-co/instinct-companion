# Harness design language

The maintained implementation is `app/layout.tsx` and `app/globals.css` in
Companion. Reuse their tokens and primitives; update shared definitions instead
of appending a competing theme. Source references, when available locally:
`app/layout.tsx`, `app/globals.css`, and `components/app-shell.tsx`. These are
read-only references for Companion work, not deployment targets.

## Typography

- Orbitron 500/700: wordmarks, compact lowercase navigation, workspace/page titles.
  Use `--display` or `.wordmark`. This is the distinctive harness face.
- Geist: body copy, inputs, readable component titles and interactions; `--font`.
- Geist Mono: compact labels, counts, timestamps, measurements, status;
  `--mono`. Avoid turning explanatory paragraphs into tiny monospace text.
- Fonts are self-hosted through Next's font loader in the root layout.
- Typical sizes: 15–17px wordmark, 11–12px navigation, 23–26px page title,
  13–16px readable content, 10–12px secondary metadata. Increase secondary text
  when needed for readability; do not copy low-contrast text from a reference.

## Surfaces and color

Use `--ink` (#171717), `--paper` (white), `--line` (#e5e5e5), and `--muted`
(#737373). Neutral #f5f5f5 marks selected navigation and subtle surfaces.
Companion uses Instinct Companion violet (#7c3aed, currently `--blue`) for agent accents,
focus and selected agent controls. The legacy token name does not mean blue.
Oasis's brand blue belongs to Oasis; do not mix two brand palettes arbitrarily.
Primary actions are dark with white text. Errors and connection states retain
semantic colors and explicit text. Do not claim connectivity from decoration.

Cards have thin borders, roughly 10–12px corners and little or no shadow.
Use 16px card gaps, 16–24px internal padding, and 24–32px desktop canvas padding.
The violet orb is an agent accent, not a gradient treatment for every card.

## Shell and bespoke content

Preserve the compact navigation with Home, Spaces and Activity, one account
control at the upper right, and a small button for an initially closed Instinct Companion
chat panel. The app is a viewing surface: no manual add, edit, delete, reorder,
completion, or version-history controls. Changes happen through the agent. On narrow screens the agent panel overlays the
workspace and has a visible close button. Keep all essential workspace controls
reachable without the desktop layout. Do not reintroduce a large generic SaaS
sidebar or change the shell for each generated dashboard.

Inside the workspace, choose the layout to suit the task: comparison table,
calendar, timeline, chart, compact list, or another justified component. Use
full-width regions when content needs them; adjacent small panels may use two
columns and stack on phones. Preserve meaningful reading order. Long titles,
URLs, and user-supplied records must wrap or scroll within their region, never
force the whole page sideways.

Use existing Lucide icons. Label icon-only actions. Provide focus visibility,
keyboard-accessible controls, text alternatives for charts, and an explicit
empty state when data is absent. Keep user data as text or validated values,
never executable markup. Imported design files should influence composition
while inheriting these fonts, colors, controls and shell rules.
