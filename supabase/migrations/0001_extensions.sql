-- Extensions used by PitchGlobe.
-- pg_cron + pg_net power the scheduled ingestion (see 0006_cron.sql).
-- pg_net lives in the extensions schema (security lint 0014: keep public clean).
create schema if not exists extensions;
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- Single updated_at trigger function shared by every table. Plain invoker
-- rights are enough for a trigger, and clients have no reason to call it.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.set_updated_at() from public, anon, authenticated;
