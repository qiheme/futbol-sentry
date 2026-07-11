// Hourly: fetch upcoming/finished fixtures for current competitions from
// football-data.org, resolve entities, upsert only changed rows.
// Missing FOOTBALL_DATA_API_KEY is a graceful skip (logged, exit 200).

import { createStore, serviceClient } from '../_shared/db.ts';
import { fetchJson, logRun, sleep } from '../_shared/ingestion-log.ts';
import { footballDataAdapter } from '../_shared/adapters/football-data.ts';
import { ingestFixtures } from '../_shared/pipeline.ts';

Deno.serve(async () => {
  const db = serviceClient();
  try {
    const result = await ingestFixtures({
      apiKey: Deno.env.get('FOOTBALL_DATA_API_KEY'),
      fetchJson,
      store: createStore(db, footballDataAdapter.source),
      sleep,
    });
    await logRun(db, footballDataAdapter.source, 'ingest-fixtures', result);
    return Response.json(result, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logRun(db, footballDataAdapter.source, 'ingest-fixtures', {
      status: 'error',
      rowsUpserted: 0,
      error: message,
    });
    return Response.json({ status: 'error', error: message }, { status: 500 });
  }
});
