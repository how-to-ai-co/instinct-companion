# Legacy Codex runtime (optional reference only)

The current app uses Supabase and `/api/memory`, with no Codex connection. Follow README.md and API.md for the current installation. The older setup below is not required.

# Optional private installation

The default deployment is an empty viewing shell. It does not connect visitors
to a shared agent. The repository also includes the companion app's backend
source for a personal installation. This is a prototype, not a turnkey hosted
multi-user service.

Use a persistent Linux host with Node 24+, the package-lock dependencies, and a
Codex CLI version whose App Server protocol supports the methods in
`scripts/agent-bridge.mjs`. Check the current official protocol before upgrading.
The Vercel demo intentionally rejects backend authentication and writes.

Copy `.env.example` to a private environment file. For self-hosting only, set
`NEXT_PUBLIC_DEMO_MODE=false` before building, generate independent strong values
for the app password, session secret, and integration token, and set your actual
HTTPS origin. Keep `.data` persistent, private, and backed up. Set a private Unix
socket path in `COMPANION_AGENT_SOCKET` for both web and bridge processes.

Run `npm ci`, `npm test`, and `npm run build`. Supervise the web app and
`scripts/agent-bridge.mjs` as separate services. The bridge needs a dedicated
`CODEX_HOME`, `COMPANION_ROOT` pointing to this checkout, `COMPANION_DATA_DIR`,
and `COMPANION_CODEX_BIN`. Run it as an unprivileged account. Keep the socket and
Codex credential directory private; do not expose the bridge to the internet.
Host behind HTTPS and configure restart behavior and resource limits.

The app's account control starts the official ChatGPT device-code flow through
Codex. The owner completes it at OpenAI. Keep that provider login separate from
the app's own login and the token handed to Instinct. Never share one person's
provider login with community visitors.

## API routes implemented here

All paths are relative to your own origin. Read `app/api` for the validated
request schemas. Do not treat these as built-in Instinct endpoints.

- `GET /api/events`: read the workspace state using the integration bearer token.
- `POST /api/events`: deliver a record to an existing collection or checklist.
- `POST /api/instinct`: submit an explicit agent request with a stable requestId.
- `GET /api/instinct?runId=...`: inspect a submitted job's completion or failure.

Instinct needs an outbound HTTP tool or integration facility configured with
your URL and token. This repository does not install a sender inside Instinct.
A successful submission is not proof that a job finished. Check its status.

The bridge exposes validated workspace tools. Source generation, continuous
conversation forwarding, calendars, scraping, and autonomous external messaging
are not included. The optional Jev module is a prior promotional experiment with
a fixed expiration guard; the public demo never calls it. Do not remove cost
controls or assume any promotion is still available without checking pricing.
