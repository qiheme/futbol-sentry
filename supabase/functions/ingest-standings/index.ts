// Every 6h: fetch standings for mapped competitions from football-data.org,
// bootstrap seasons from the payload, and upsert.
// Missing FOOTBALL_DATA_API_KEY is a graceful skip (logged, exit 200).

import { ingestStandings } from '../_shared/pipeline.ts';
import { serveIngest } from '../_shared/serve.ts';

serveIngest('ingest-standings', ingestStandings);
