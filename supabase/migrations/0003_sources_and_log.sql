-- Source-mapping tables: canonical uuid <-> upstream identifier, per source.
-- confidence 1.0 = deterministic mapping (seeded or stable upstream id);
-- fuzzy matches (Phase 2) record their score and queue 0.80-0.92 for review.

create table public.competition_sources (
  id uuid primary key default gen_random_uuid(),
  canonical_id uuid not null references public.competitions(id) on delete cascade,
  source text not null,
  source_id text not null,
  source_name text,
  confidence numeric not null default 1.0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, source_id)
);

create table public.team_sources (
  id uuid primary key default gen_random_uuid(),
  canonical_id uuid not null references public.teams(id) on delete cascade,
  source text not null,
  source_id text not null,
  source_name text,
  confidence numeric not null default 1.0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, source_id)
);

create table public.player_sources (
  id uuid primary key default gen_random_uuid(),
  canonical_id uuid not null references public.players(id) on delete cascade,
  source text not null,
  source_id text not null,
  source_name text,
  confidence numeric not null default 1.0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, source_id)
);

create table public.match_sources (
  id uuid primary key default gen_random_uuid(),
  canonical_id uuid not null references public.matches(id) on delete cascade,
  source text not null,
  source_id text not null,
  source_name text,
  confidence numeric not null default 1.0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, source_id)
);

create index competition_sources_canonical_idx on public.competition_sources (canonical_id);
create index team_sources_canonical_idx on public.team_sources (canonical_id);
create index player_sources_canonical_idx on public.player_sources (canonical_id);
create index match_sources_canonical_idx on public.match_sources (canonical_id);

-- Every ingestion run logs here, success or failure.
create table public.ingestion_log (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  endpoint text not null,
  run_at timestamptz not null default now(),
  status text not null check (status in ('success', 'error', 'skipped')),
  rows_upserted int not null default 0,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ingestion_log_run_at_idx on public.ingestion_log (run_at desc);

do $$
declare t text;
begin
  foreach t in array array[
    'competition_sources', 'team_sources', 'player_sources',
    'match_sources', 'ingestion_log'
  ] loop
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()', t);
  end loop;
end;
$$;
