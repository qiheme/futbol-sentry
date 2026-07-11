# CLAUDE.md — PitchGlobe conventions

Guidance for future Claude/Codex sessions working in this repo.

## What this is

Global football tracker. **Fetch-and-cache**: users only ever read from
Supabase. Upstream sports APIs are polled by Supabase Edge Functions on cron,
normalized, and upserted into Postgres. Never call an upstream API from the
frontend or have the user's browser hit one directly.

## Stack rules (do not deviate)

- **Astro** static output + **React islands** for interactive/live UI.
- **Cobalt (`@q-labs/cobalt`) is the design system — NOT Tailwind.** Build UI
  from Cobalt components. For surfaces Cobalt lacks (it has **no Table and no
  Tabs**), write semantic HTML styled with **Cobalt CSS-variable tokens**
  (`--bg-*`, `--text-*`, `--accent-*`, `--space-*`, `--radius-*`, `--font-*`,
  `--weight-*`, `--tracking-*`) — never hardcoded colors/sizes. Don't add
  Tailwind unless a surface genuinely needs it.
- Cobalt is dark-first: `styles.css` imported once in `src/layouts/Base.astro`,
  `data-theme="dark"` on `<html>`. Don't wrap `.astro` pages in
  `CobaltProvider` — only inside a hydrated island needing a theme override.
- Cobalt component variant enums are not documented publicly. Read the installed
  `node_modules/@q-labs/cobalt/dist/esm/**/*.d.ts` before using a component.
  Known: `Badge` variants `default|active|warning|danger|info|shipped|wip`;
  `StatusDot` `active|warning|danger|info|offline`; `Button` `primary|ghost`;
  `Heading` `level={1..6}`; `Display`/`Body`/`Label`/`Mono` size variants.
- **TypeScript** everywhere. Regenerate `src/lib/database.types.ts` from the live
  schema after any migration.

## Layout

- `src/lib/` — `supabase.ts` (anon client, read-only via RLS), `queries.ts`
  (typed reads), `helpers.ts` (pure presentation logic), `database.types.ts`.
- `src/components/react/` — React components (statically rendered in `.astro`
  unless given a `client:*` directive). `src/components/seo/` — meta/JSON-LD.
- `src/pages/` — routes; detail pages prerender via `getStaticPaths`.
- `supabase/migrations/` — ordered SQL, applied via the Supabase MCP or CLI.
- `supabase/functions/` — Deno edge functions; shared code in `_shared/`.
  The **adapter pattern** (`_shared/adapters/`) is the seam for new sources
  (ESPN etc.); the `Store` interface in `_shared/pipeline.ts` keeps pipeline
  logic DB-agnostic and unit-testable.

## Workflow: red-green-refactor

Write the failing test first, confirm it fails for the right reason, implement
the minimum to pass, then refactor. Vitest for pure logic (adapters, pipeline,
helpers); Playwright for user-visible behavior.

```bash
npm test                                   # vitest (unit)
PW_CHROMIUM_PATH=/opt/pw-browsers/chromium npm run test:e2e   # playwright
npm run build                              # static build (needs Supabase egress)
```

`npm run build` wires `scripts/css-stub-loader.mjs` via `NODE_OPTIONS` — Astro 7
keeps node_modules external during prerender, so Node imports Cobalt directly and
this loader stubs Cobalt's raw `.css` side-effect imports (class maps + the
global `styles.css` bundle are unaffected). Don't remove it.

## Secrets hygiene

- `FOOTBALL_DATA_API_KEY` → Supabase Edge Function secret only, never committed
  (football-data.org Terms §6.1). Functions skip gracefully without it.
- `.npmrc` in the repo holds only the registry mapping; the GitHub Packages
  token stays in env (`GITHUB_TOKEN` locally, `NPM_TOKEN` on the deploy host).
- Cron reads `project_url` + `anon_key` from Supabase Vault — never inline them.
- `PUBLIC_SUPABASE_*` are public by design (RLS-guarded) and belong in the client
  bundle.

## Supabase project

Phase 1 uses the `pitchglobe` project (ref `onpxhlufgqmvjckydacp`, org
`kvtoojxoyulurqyiarxl`, free tier). Realtime is enabled on `matches`,
`match_events`, `standings` for Phase 3.

## Required attribution

The football-data.org footer string **"Football data provided by the
Football-Data.org API"** must stay on every page (Terms §7.1). It lives in
`Base.astro` and is covered by `e2e/shell.spec.ts`.
