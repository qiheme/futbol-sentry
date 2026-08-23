// Hourly: fetch fixtures for mapped competitions from football-data.org,
// bootstrap seasons from the payload, resolve entities, upsert changed rows.
// Missing FOOTBALL_DATA_API_KEY is a graceful skip (logged, exit 200).

import { ingestFixtures } from '../_shared/pipeline.ts';
import { serveIngest } from '../_shared/serve.ts';

serveIngest('ingest-fixtures', ingestFixtures);
