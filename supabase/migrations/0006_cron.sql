-- Scheduled ingestion via pg_cron + pg_net.
--   ingest-fixtures : hourly
--   ingest-standings: every 6 hours
--
-- The project URL and the anon JWT (used as the Authorization bearer) are read
-- from Vault secrets `project_url` and `anon_key` at call time — never inlined
-- here — so no credentials live in source control. Create those secrets once
-- per environment before this migration runs:
--   select vault.create_secret('https://<ref>.supabase.co', 'project_url');
--   select vault.create_secret('<anon-jwt>', 'anon_key');
--
-- Respects the free-tier cron guidance (<=8 concurrent jobs, <=10 min each):
-- only two jobs, each a single fire-and-forget HTTP POST.

create or replace function public.invoke_ingest(fn text)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  base text;
  key text;
begin
  select decrypted_secret into base
    from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into key
    from vault.decrypted_secrets where name = 'anon_key';
  if base is null or key is null then
    raise notice 'invoke_ingest: project_url/anon_key vault secrets not set; skipping %', fn;
    return;
  end if;

  perform net.http_post(
    url := base || '/functions/v1/' || fn,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || key
    )
  );
end;
$$;

revoke execute on function public.invoke_ingest(text) from public, anon, authenticated;

-- Re-schedule idempotently (unschedule if the job already exists).
do $$
begin
  perform cron.unschedule('ingest-fixtures-hourly');
exception when others then null;
end;
$$;
do $$
begin
  perform cron.unschedule('ingest-standings-6h');
exception when others then null;
end;
$$;

select cron.schedule(
  'ingest-fixtures-hourly', '0 * * * *',
  $$select public.invoke_ingest('ingest-fixtures')$$
);
select cron.schedule(
  'ingest-standings-6h', '0 */6 * * *',
  $$select public.invoke_ingest('ingest-standings')$$
);
