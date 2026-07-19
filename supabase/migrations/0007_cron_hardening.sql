-- Cron hardening (review follow-ups):
-- 1. invoke_ingest now LOGS misconfiguration to ingestion_log instead of a
--    notice buried in postgres logs — the observability table records every
--    outcome, including "cron fired but Vault secrets are missing".
-- 2. Ingest endpoints require a shared token. The platform's JWT check accepts
--    any valid project JWT (including the public anon key), so the functions
--    additionally require the `ingest_token` Vault secret, sent by cron as the
--    x-ingest-token header and read by the functions via a service-role-only
--    RPC. Create the secret once per environment:
--      select vault.create_secret(gen_random_uuid()::text, 'ingest_token');

-- Service-role-only accessor for the shared ingest token.
create or replace function public.get_ingest_token()
returns text
language sql
security definer set search_path = ''
as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'ingest_token';
$$;

revoke execute on function public.get_ingest_token() from public, anon, authenticated;
-- Supabase default privileges already grant service_role EXECUTE on new public
-- functions, but make it explicit so the migration doesn't depend on them.
grant execute on function public.get_ingest_token() to service_role;

create or replace function public.invoke_ingest(fn text)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  base text;
  key text;
  token text;
begin
  select decrypted_secret into base
    from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into key
    from vault.decrypted_secrets where name = 'anon_key';
  select decrypted_secret into token
    from vault.decrypted_secrets where name = 'ingest_token';
  if base is null or key is null or token is null then
    insert into public.ingestion_log (source, endpoint, status, rows_upserted, error)
    values ('cron', fn, 'error', 0,
            'cron: vault secrets missing (need project_url, anon_key, ingest_token)');
    return;
  end if;

  perform net.http_post(
    url := base || '/functions/v1/' || fn,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || key,
      'x-ingest-token', token
    )
  );
end;
$$;

revoke execute on function public.invoke_ingest(text) from public, anon, authenticated;
