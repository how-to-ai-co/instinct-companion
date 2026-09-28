# Instinct Companion App

An empty, read-only starting point for a personal Instinct companion.

[Open the app](https://instinct-companion.vercel.app)

## Run locally

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:8790`. The default public shell has no records, chat, login, or connected accounts. Vercel builds cannot read or write the private backend.

Run `npm test` and `npm run build` before publishing changes. The optional existing backend requires a persistent host; see [SELF-HOSTING.md](SELF-HOSTING.md). Cloning and deploying to Vercel alone does not create an Instinct connection.
