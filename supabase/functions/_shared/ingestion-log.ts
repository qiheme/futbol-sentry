import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import type { RunResult } from './pipeline.ts';

// Records every run — success, error, or graceful skip — for observability.
export async function logRun(
  db: SupabaseClient,
  source: string,
  endpoint: string,
  result: RunResult,
): Promise<void> {
  await db.from('ingestion_log').insert({
    source,
    endpoint,
    status: result.status,
    rows_upserted: result.rowsUpserted,
    error: result.error ?? null,
  });
}
