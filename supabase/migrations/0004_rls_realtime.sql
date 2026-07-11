-- RLS: public read on everything; no write policies. Edge Functions write with
-- the service role, which bypasses RLS.

do $$
declare t text;
begin
  foreach t in array array[
    'competitions', 'seasons', 'venues', 'teams', 'players',
    'matches', 'match_events', 'standings', 'lineups',
    'competition_sources', 'team_sources', 'player_sources',
    'match_sources', 'ingestion_log'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "public read" on public.%I for select to anon, authenticated using (true)', t);
  end loop;
end;
$$;

-- Realtime broadcasts for live surfaces (consumed by Phase 3 islands).
alter publication supabase_realtime add table public.matches;
alter publication supabase_realtime add table public.match_events;
alter publication supabase_realtime add table public.standings;
