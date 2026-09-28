# Instinct Companion App

A read-only visual memory for Instinct, with built-in links, lists, reminders, tasks, projects, notes and facts. No Codex or LLM connection is used by this interface or its memory API.

[Open the public app](https://instinct-companion.vercel.app)

## Your own installation

1. Clone this repo and run `npm ci`.
2. Create **your own Supabase project** and run `supabase/migrations/202609280001_companion.sql` in its SQL Editor.
3. Copy `.env.example` to `.env.local` and set your Supabase URL, server-side service-role key, and a unique integration key. Generate the integration key with `openssl rand -hex 32`.
4. Choose who can read your installation. `COMPANION_PUBLIC_READ=true` makes **every saved record and delivered message public**. For personal information, put your deployment behind access protection; otherwise keep public read disabled until you add viewer authentication. No viewer login is bundled.
5. Run `npm run dev`, or deploy to your own Vercel project with the same environment variables. Environment secrets belong in your hosting settings, never GitHub.
6. Configure an Instinct HTTP tool/forwarder using [API.md](API.md). Test a delivery before enabling automatic forwarding.

The repository contains no shared database credentials. It does not create or configure a sender inside Instinct. It saves only what your integration delivers. Plain messages appear in Activity; typed records appear in their views. Data is saved immediately and the viewing page refreshes every five seconds. Reminders display dates but do not send notifications. The UI displays the latest 1,000 records and 50 deliveries; older data remains in Supabase.

Run `npm test` and `npm run build` before deploying. Older optional agent/SQLite code remains for reference; the main page uses only `/api/memory` and Supabase. Do not configure the legacy Codex paths for this version.
