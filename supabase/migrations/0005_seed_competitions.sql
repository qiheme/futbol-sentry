-- Deterministic competition seed: the 12 football-data.org competitions,
-- each with a canonical row + a competition_sources mapping (confidence 1.0).
-- ESPN slugs join these mappings in Phase 2.

with seed(slug, name, type, confederation, country, tier, fd_code, fd_name) as (
  values
    ('premier-league',        'Premier League',        'league',        'UEFA',     'England',       1, 'PL',  'Premier League'),
    ('la-liga',               'La Liga',               'league',        'UEFA',     'Spain',         1, 'PD',  'Primera División'),
    ('bundesliga',            'Bundesliga',            'league',        'UEFA',     'Germany',       1, 'BL1', 'Bundesliga'),
    ('serie-a',               'Serie A',               'league',        'UEFA',     'Italy',         1, 'SA',  'Serie A'),
    ('ligue-1',               'Ligue 1',               'league',        'UEFA',     'France',        1, 'FL1', 'Ligue 1'),
    ('champions-league',      'UEFA Champions League', 'cup',           'UEFA',     null,            1, 'CL',  'UEFA Champions League'),
    ('eredivisie',            'Eredivisie',            'league',        'UEFA',     'Netherlands',   1, 'DED', 'Eredivisie'),
    ('primeira-liga',         'Primeira Liga',         'league',        'UEFA',     'Portugal',      1, 'PPL', 'Primeira Liga'),
    ('championship',          'Championship',          'league',        'UEFA',     'England',       2, 'ELC', 'Championship'),
    ('brasileirao',           'Campeonato Brasileiro Série A', 'league','CONMEBOL', 'Brazil',        1, 'BSA', 'Campeonato Brasileiro Série A'),
    ('world-cup',             'FIFA World Cup',        'international', 'FIFA',     null,            1, 'WC',  'FIFA World Cup'),
    ('european-championship', 'UEFA European Championship', 'international', 'UEFA', null,           1, 'EC',  'European Championship')
),
inserted as (
  insert into public.competitions (slug, name, type, confederation, country, gender, tier)
  select slug, name, type, confederation, country, 'm', tier
  from seed
  on conflict (slug) do nothing
  returning id, slug
),
all_comps as (
  select c.id, c.slug from public.competitions c
  where c.slug in (select slug from seed)
)
insert into public.competition_sources (canonical_id, source, source_id, source_name, confidence)
select a.id, 'football-data', s.fd_code, s.fd_name, 1.0
from all_comps a
join seed s on s.slug = a.slug
on conflict (source, source_id) do nothing;
