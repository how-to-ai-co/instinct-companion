# Instinct Companion App

An Instinct companion app gives your agent’s work a visual home. Keep talking to Instinct, while useful information appears in a website you can open anytime. A bike search becomes a page of listings, prices, and links, instead of results getting buried in messages.

An **API** is simply a way for two apps to exchange information. You give Instinct your app’s address and a private access key. It can then send findings to the companion app and read saved information back. That key only grants the operations your app allows; it does not give access to your whole computer.

In a self-hosted installation, a Codex agent connected through your ChatGPT account can organize the information into views. You browse those views and request changes through conversation. App login, the Instinct API key, and the Codex account connection are separate. See the official [Codex App Server documentation](https://learn.chatgpt.com/docs/app-server) for the account-connection flow.

The goal is an app that adapts to what you’re doing. This prototype supports saved workspaces and agent composition of existing components. Automatic conversation forwarding and generating entirely new components are future work. **The public Vercel site is a viewing demo with fictional data, no connected accounts, no live inference, and no personal information.**

## Try the demo locally

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:8790`. Demo mode is on by default. No secrets are required.

`npm test` checks the storage and agent boundaries. `npm run build` checks the app. See [SELF-HOSTING.md](SELF-HOSTING.md) for the optional private runtime. Never upload a real database, `.env` file, provider credentials, or conversation history.
