# PitchGlobe

A global football (soccer) tracker — live scores, fixtures, standings, and match
events across the world's competitions. Built on a **fetch-and-cache**
architecture: users never call upstream sports APIs; Supabase Edge Functions poll
them on a schedule, normalize the data, and store it in Postgres. The Astro
frontend reads only from Supabase.

## Stack

- **Astro** (static output) with **React islands** for live/interactive UI
- **[Cobalt](https://github.com/Q-Labs/cobalt)** (`@q-labs/cobalt`) — dark-first
  design system (React components + CSS-variable tokens). Not Tailwind.
- **Supabase** — Postgres, Auth, Realtime, Edge Functions (Deno)
- **TanStack Query** inside islands
- **TypeScript** everywhere
- Tests: **Vitest** (unit) + **Playwright** (e2e)

## Prerequisites

### 1. GitHub Packages auth (for Cobalt)

Cobalt is published to GitHub Packages, not public npm. The project `.npmrc`
(committed) maps the scope:

```
@q-labs:registry=https://npm.pkg.github.com
```

Your user-level `~/.npmrc` must supply a token with `read:packages` scope:

```
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

On a CI/deploy host (Vercel/Netlify), set that token as `NPM_TOKEN` so
`npm install` can pull the package.

### 2. Environment variables

Copy `.env.example` to `.env` and fill in:

| Variable | Where | Notes |
| --- | --- | --- |
| `PUBLIC_SUPABASE_URL` | build + client | Public. Project API URL. |
| `PUBLIC_SUPABASE_ANON_KEY` | build + client | Public (RLS-guarded, read-only). |
| `PUBLIC_SITE_URL` | build | Canonical/sitemap base URL. |
| `FOOTBALL_DATA_API_KEY` | Supabase secret only | **Never commit** (football-data.org Terms §6.1). Set via `supabase secrets set`. |

## Install & run

```bash
npm install
npm run dev        # dev server at http://localhost:4321
npm run build      # static build into dist/
npm run preview    # preview the built site
```

> The static build reads from Supabase at build time, so the Supabase host must
> be reachable from wherever you build (locally, CI, and the deploy host).

## Tests

```bash
npm test           # Vitest: adapter, pipeline, query helpers
npm run test:e2e   # Playwright: pages, tab strip a11y, theme, attribution
```

Playwright runs against the dev server (which reads seeded Supabase data). In
this repo's remote environment, Chromium lives at `/opt/pw-browsers/chromium`;
set `PW_CHROMIUM_PATH=/opt/pw-browsers/chromium` when running e2e there.

## Backend (Supabase)

- **Migrations** live in `supabase/migrations/` (`0001`–`0006`). They create the
  schema, RLS (public read; writes via service role only), the Realtime
  publication, the competition seed, and the pg_cron/pg_net schedules.
- **Sample data**: `supabase/seed/sample_data.sql` seeds the top-5 leagues so
  pages render before a football-data.org key exists.
- **Edge Functions**: `supabase/functions/ingest-fixtures` (hourly) and
  `ingest-standings` (every 6h). Both share `_shared/` (adapter, pipeline, DB
  store, request shell). Seasons are **bootstrapped automatically** from the
  upstream payload — no manual season seeding is needed for ingestion to work.
  Without `FOOTBALL_DATA_API_KEY` they log a graceful `skipped` row in
  `ingestion_log` and exit cleanly.
- **Auth**: the ingest endpoints require the `x-ingest-token` header in
  addition to a valid JWT — the public anon key alone cannot trigger them.
- **Cron** reads three Vault secrets (`project_url`, `anon_key`,
  `ingest_token`) — create them per environment before applying `0006`/`0007`.
  If they're missing, cron logs an `error` row in `ingestion_log` instead of
  failing silently.

Turn on real ingestion by setting the football-data.org key, and clear the
synthetic sample matches so they don't sit alongside real fixtures:

```bash
supabase secrets set FOOTBALL_DATA_API_KEY=your-key --project-ref <ref>
# then run supabase/seed/cleanup_seed.sql against the project
```

## Deploy

`output: 'static'` → deploy `dist/` to any static host. On a host that rebuilds
from git, provide `NPM_TOKEN` (read:packages) so Cobalt installs, plus the
`PUBLIC_SUPABASE_*` env vars.

See `ROADMAP.md` for phase status and open items, and `CLAUDE.md` for
conventions.
