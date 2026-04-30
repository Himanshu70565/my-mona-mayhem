
# Mona Mayhem Copilot Instructions

## Build, run, and verification commands

```bash
npm install
npm run dev
npm run build
npm run preview
```

- There are currently **no lint** or **automated test** scripts configured in `package.json`.
- For a quick single-endpoint check while `npm run dev` is running:

```bash
curl http://localhost:4321/api/contributions/octocat
```

## High-level architecture

This repository has two parallel surfaces:

1. **Astro application code** in `src/`:
   - `src/pages/index.astro` is the main app page scaffold.
   - `src/pages/api/contributions/[username].ts` is a server API route (dynamic path) intended to proxy GitHub contribution data.
   - `astro.config.mjs` uses `output: "server"` with the Node adapter in standalone mode, so app code is designed to run server-side (not static export).

2. **Workshop/documentation site content** in `docs/` and `workshop/`:
   - `docs/` contains static landing/step HTML and shared styles/scripts.
   - `workshop/` contains lab markdown content plus localized tracks (`es`, `pt_BR`).
   - `.github/workflows/deploy.yml` deploys only docs/workshop content to GitHub Pages by copying them into `_site`; it does **not** build/deploy the Astro app.

## Repository-specific conventions

- Treat this as a **workshop starter template**: app implementation work should usually happen in `src/pages/*`; workshop curriculum content lives in `workshop/*` and static docs in `docs/*`.
- Keep API routes explicitly typed with Astro types (`APIRoute`) and return JSON responses with explicit status codes/content type.
- Keep `export const prerender = false` for server-only API routes that depend on runtime fetching.
- TypeScript strict mode is enabled via `astro/tsconfigs/strict`; prefer strongly typed interfaces for contribution payloads and avoid `any`.
- If updating multilingual workshop/docs content, preserve parity across locale directories (`docs/es`, `docs/pt_BR`, `workshop/es`, `workshop/pt_BR`) unless the task explicitly scopes to one locale.
