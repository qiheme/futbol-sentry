---
name: verify
description: Build, run and drive PitchGlobe to observe a change working — static site in a browser, and the deployed Supabase edge functions over HTTP. Use when verifying a diff, reproducing a UI/ingestion bug, or capturing screenshots of the running app.
---

# Verifying PitchGlobe

Two independent surfaces. Pick the one the change touches.

## Surface 1 — the site (Astro static + React islands)

The build reads Supabase at build time and the `TodayFixtures` island reads it
again in the browser. **If `*.supabase.co` egress is blocked** (common in remote
sessions — `curl` the REST root returns `000`), point the app at a local
PostgREST-shaped stub instead of giving up:

```bash
cat > .env <<'ENV'
PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
PUBLIC_SUPABASE_ANON_KEY=stub-anon-key
PUBLIC_SITE_URL=http://localhost:4321
ENV
node mock-supabase.mjs &     # serves /rest/v1/<table>, evaluates eq/gte/lt/or
npx astro build              # no NODE_OPTIONS needed — see below
npx --yes http-server dist -p 4321 -s &
```

A working stub lives in this skill's directory (`mock-supabase.mjs`). It returns
rows with embedded relations **pre-joined** under the alias names `queries.ts`
uses (`competition`, `home_team`, `away_team`, `team`, `season`, `venue`) —
PostgREST-style `select=` is ignored, extra fields are harmless. It evaluates
filters for real, so query predicates genuinely decide the rows.

Gotchas learned the hard way:

- **Put driver scripts inside the repo**, not the scratchpad — otherwise
  `import { chromium } from '@playwright/test'` fails to resolve.
- Chromium is at `/opt/pw-browsers/chromium`; pass it as `executablePath`.
- The stub must answer **OPTIONS with 204 + `Access-Control-Allow-Headers: *`**
  or supabase-js preflight fails in the browser.
- `todayFixtures` never appears in a build-time request log — it is a
  `client:load` island. Drive a **browser** to observe it.
- Playwright `newContext({ timezoneId })` is how you prove local-day behavior;
  the container itself is UTC.
- Google Fonts is blocked by egress → a harmless `ERR_CONNECTION_RESET` console
  error on every page. Ignore it.
- `npm install` needs `//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}` in
  `~/.npmrc` for `@q-labs/cobalt` (repo `.npmrc` only maps the registry).

`astro.config.mjs` registers `scripts/css-stub-hooks.mjs`, so **plain
`npx astro build` works** — no `NODE_OPTIONS`. If prerender dies with
`ERR_UNKNOWN_FILE_EXTENSION .css`, that registration was removed.

## Surface 2 — deployed edge functions (real HTTP)

Egress can't reach them either, but **pg_net can** — it runs inside Supabase.
Use the Supabase MCP `execute_sql`, then read the response back:

```sql
select net.http_post(
  url := (select decrypted_secret from vault.decrypted_secrets where name='project_url')
         || '/functions/v1/ingest-fixtures',
  headers := jsonb_build_object(
    'Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name='anon_key'),
    'x-ingest-token',(select decrypted_secret from vault.decrypted_secrets where name='ingest_token'))
) as request_id;
-- then, a few seconds later:
select status_code, content from net._http_response where id = <request_id>;
```

Expected: valid token → 200; missing/wrong `x-ingest-token` → 401
`{"status":"unauthorized"}`; no `Authorization` → 401 from the platform.
Every run also appends to `public.ingestion_log` — check it.

**`execute_sql` only returns the LAST statement's result**, and `raise notice`
output is lost. To see intermediate values, write them into a temp table and
`select * from` it at the end.

To exercise the cron misconfig path, rename a vault secret, call
`invoke_ingest`, then rename it back **in the same `do $$` block** so a failure
rolls back. Always re-check afterwards that `project_url`, `anon_key` and
`ingest_token` all still resolve — cron silently breaks otherwise.
