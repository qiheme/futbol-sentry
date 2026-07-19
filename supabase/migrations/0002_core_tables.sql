-- Core canonical entities. Every entity gets our own uuid; upstream identifiers
-- live in the *_sources mapping tables (0003) so sources can be swapped freely.

create table public.competitions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  type text not null check (type in ('league', 'cup', 'international', 'supercup')),
  confederation text,
  country text,
  gender text not null default 'm' check (gender in ('m', 'w')),
  tier int,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  year_label text not null,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (competition_id, year_label)
);

create table public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  country text,
  capacity int,
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short_name text,
  country text,
  crest_url text,
  venue_id uuid references public.venues(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  position text,
  nationality text,
  birth_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  competition_id uuid not null references public.competitions(id) on delete cascade,
  home_team_id uuid not null references public.teams(id) on delete cascade,
  away_team_id uuid not null references public.teams(id) on delete cascade,
  venue_id uuid references public.venues(id) on delete set null,
  kickoff_utc timestamptz not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'live', 'finished', 'postponed')),
  minute int,
  home_score int,
  away_score int,
  stage text,
  matchday int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.match_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  minute int,
  type text not null
    check (type in ('goal', 'own_goal', 'penalty', 'yellow', 'red', 'sub', 'var')),
  team_id uuid references public.teams(id) on delete set null,
  player_id uuid references public.players(id) on delete set null,
  assist_player_id uuid references public.players(id) on delete set null,
  detail text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.standings (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  position int not null,
  played int not null default 0,
  won int not null default 0,
  drawn int not null default 0,
  lost int not null default 0,
  gf int not null default 0,
  ga int not null default 0,
  gd int not null default 0,
  points int not null default 0,
  form text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (season_id, team_id)
);

create table public.lineups (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  is_starter boolean not null default false,
  shirt_number int,
  position text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (match_id, player_id)
);

-- Read-path indexes.
create index matches_kickoff_utc_idx on public.matches (kickoff_utc);
create index matches_competition_status_idx on public.matches (competition_id, status);
create index matches_season_idx on public.matches (season_id);
create index matches_home_team_idx on public.matches (home_team_id);
create index matches_away_team_idx on public.matches (away_team_id);
create index match_events_match_idx on public.match_events (match_id);
create index standings_season_position_idx on public.standings (season_id, position);
create index seasons_competition_idx on public.seasons (competition_id);
create index lineups_match_idx on public.lineups (match_id);

-- updated_at triggers.
do $$
declare t text;
begin
  foreach t in array array[
    'competitions', 'seasons', 'venues', 'teams', 'players',
    'matches', 'match_events', 'standings', 'lineups'
  ] loop
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()', t);
  end loop;
end;
$$;
