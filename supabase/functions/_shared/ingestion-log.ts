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

// Shared JSON fetcher with football-data auth + basic 429 back-off.
export async function fetchJson(url: string, apiKey: string): Promise<unknown> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { headers: { 'X-Auth-Token': apiKey } });
    if (res.status === 429) {
      const retry = Number(res.headers.get('Retry-After') ?? '10');
      await new Promise((r) => setTimeout(r, (retry + 1) * 1000));
      continue;
    }
    if (!res.ok) {
      throw new Error(`football-data ${res.status} for ${url}`);
    }
    return await res.json();
  }
  throw new Error(`football-data rate-limited after retries for ${url}`);
}

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
