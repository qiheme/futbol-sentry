-- Removes the synthetic sample matches (and, via FK cascades, their
-- match_events and match_sources rows) once real ingestion is enabled, so
-- fabricated results never sit alongside real fixtures.
--
-- Seeded teams/competitions/seasons are kept: they carry real football-data
-- ids and real ingestion converges on the same canonical rows. Seeded
-- standings are kept too — the standings upsert overwrites them on the first
-- real ingest-standings run.
delete from public.matches
where id in (
  select canonical_id from public.match_sources where source = 'seed'
);
