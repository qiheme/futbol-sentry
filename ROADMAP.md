# PitchGlobe Roadmap

Phase tracker and open items. Phase 1 is the current milestone.

## Phase 1 — foundation (this milestone)

Migrations + schema; football-data.org backbone; competition/team/match pages
with Cobalt; footer attribution.

- [x] Provision Supabase project (`pitchglobe`, free tier)
- [x] Scaffold Astro + Cobalt (GitHub Packages) + Vitest + Playwright
- [x] Migrations `0001`–`0005`: schema, `updated_at` triggers, indexes, RLS
      (public read / service-role writes), Realtime publication, 12-competition
      seed. Security advisors clean.
- [x] Seed sample data for the top-5 leagues (renders pages pre-API-key)
- [x] `database.types.ts` generated from the live schema
- [x] App shell: `Base.astro`, Cobalt `styles.css` + `data-theme="dark"`,
      TopNav, footer attribution — TDD (`e2e/shell.spec.ts`, verified)
- [x] Query layer: `supabase.ts`, `queries.ts`, `helpers.ts` — TDD (verified)
- [x] football-data.org adapter + ingestion pipeline (source-agnostic `Store`)
      — TDD, 27 unit tests
- [x] Edge Functions `ingest-fixtures` (hourly) + `ingest-standings` (6h),
      deployed; graceful skip without the key — verified via `ingestion_log`
- [x] Cron (`0006`) via pg_cron + pg_net, Vault-sourced secrets — verified
      (`cron.job` + full invoke chain)
- [x] Pages + components (home, competitions, competition detail, team, match),
      standings table + accessible tab strip from Cobalt tokens, SEO/JSON-LD,
      sitemap — code complete, CSS/build config verified
- [ ] **Full page e2e run + static build completion** — blocked on the Supabase
      host being on the environment's network egress allowlist (see Open items).
      Unit tests, shell e2e, deployed functions, and cron are all verified.
- [ ] **Deploy `dist/` to Vercel** — blocked on the same egress (build reads
      Supabase at build time).

## Phase 2 — breadth & entity resolution

- ESPN unofficial adapter (behind the existing `SourceAdapter` seam) for breadth
  + play-by-play events.
- Fuzzy team resolution (Jaro-Winkler, scoped to competition+season; auto-accept
  ≥0.92, queue 0.80–0.92 for review). The `*_sources` tables + confidence column
  are already in place.
- Reconcile the top-20 leagues.

## Phase 3 — live

- 60s live-polling cron (`ingest-live`, ESPN scoreboard).
- Supabase Realtime islands on `/live`, `/matches/[id]`, and home. The Realtime
  publication (matches/match_events/standings) and the `islands/` seam
  (`TodayFixtures`) are ready.
- `CobaltProvider` inside islands only if a theme override is needed.

## Phase 4 — scale

- Expand toward ESPN's full soccer league list (community-compiled, ~260) +
  women's + international.
- OpenLigaDB (German pyramid) and openfootball historical backfill, each behind
  its own adapter.

## Open items

- **Network egress**: add the Supabase host (`*.supabase.co`) to the
  environment's network allowlist so build-time reads, the full Playwright run,
  and the Vercel build succeed. (Changes apply to fresh sessions.)
- **football-data.org key**: set `FOOTBALL_DATA_API_KEY` as a Supabase Edge
  Function secret to turn on real ingestion. Until then, functions log
  `skipped` and the seeded sample data drives the UI.
- **Deploy token**: for git-triggered Vercel/Netlify builds, set a
  `read:packages` PAT as `NPM_TOKEN` so `npm install` can pull Cobalt.
- **Upstream Cobalt**: if PitchGlobe needs rich sortable tables or many tab
  strips, propose adding `Table`/`Tabs` to Cobalt rather than growing bespoke
  CSS.
- **Entity-review UI**: a small admin surface for the 0.80–0.92 fuzzy-match
  review queue (Phase 2).
