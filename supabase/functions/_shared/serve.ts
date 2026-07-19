// Shared request handler for ingest functions: caller auth, pipeline run,
// ingestion_log, and response shaping live in ONE place so the fixtures and
// standings endpoints cannot drift.

import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { footballDataAdapter } from './adapters/football-data.ts';
import { createStore, serviceClient } from './db.ts';
import { fetchJson, sleep } from './http.ts';
import { logRun } from './ingestion-log.ts';
import type { RunDeps, RunResult } from './pipeline.ts';

// The platform's verify_jwt accepts ANY valid project JWT — including the
// public anon key that ships in the client bundle. Ingest must not be
// triggerable by site visitors, so callers must also present the shared
// ingest token (Vault secret `ingest_token`, read via a service-role-only
// RPC; pg_cron sends it in the x-ingest-token header).
async function authorized(req: Request, db: SupabaseClient): Promise<boolean> {
  const presented = req.headers.get('x-ingest-token');
  if (!presented) return false;
  const { data, error } = await db.rpc('get_ingest_token');
  if (error || !data) return false;
  return presented === data;
}

export function serveIngest(
  endpoint: string,
  ingest: (deps: RunDeps) => Promise<RunResult>,
): void {
  Deno.serve(async (req) => {
    const db = serviceClient();
    if (!(await authorized(req, db))) {
      return Response.json({ status: 'unauthorized' }, { status: 401 });
    }
    try {
      const result = await ingest({
        apiKey: Deno.env.get('FOOTBALL_DATA_API_KEY'),
        fetchJson,
        store: createStore(db, footballDataAdapter.source),
        sleep,
      });
      await logRun(db, footballDataAdapter.source, endpoint, result);
      return Response.json(result, { status: 200 });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await logRun(db, footballDataAdapter.source, endpoint, {
        status: 'error',
        rowsUpserted: 0,
        error: message,
      });
      return Response.json({ status: 'error', error: message }, { status: 500 });
    }
  });
}
