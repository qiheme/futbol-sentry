-- Sample data so pages render (and e2e tests run) before FOOTBALL_DATA_API_KEY
-- is configured. Idempotent: safe to re-run.
--
-- Teams carry their REAL football-data.org ids in team_sources, so when real
-- ingestion starts it resolves to these same canonical teams. Matches are
-- mapped with source='seed' — they never collide with real upstream match ids.
-- Kickoffs are relative to now() so "today" surfaces always have content.

-- 1) Current seasons for the top-5 leagues.
insert into public.seasons (competition_id, year_label, start_date, end_date, is_current)
select c.id, '2025-26', date '2025-08-08', date '2026-05-24', true
from public.competitions c
where c.slug in ('premier-league', 'la-liga', 'bundesliga', 'serie-a', 'ligue-1')
on conflict (competition_id, year_label) do update set is_current = true;

-- 2) Teams (4 per league) with real football-data ids.
with seed_teams(slug, name, short_name, country, comp_slug, fd_id) as (
  values
    ('arsenal',           'Arsenal FC',                'Arsenal',      'England', 'premier-league', '57'),
    ('manchester-city',   'Manchester City FC',        'Man City',     'England', 'premier-league', '65'),
    ('liverpool',         'Liverpool FC',              'Liverpool',    'England', 'premier-league', '64'),
    ('chelsea',           'Chelsea FC',                'Chelsea',      'England', 'premier-league', '61'),
    ('real-madrid',       'Real Madrid CF',            'Real Madrid',  'Spain',   'la-liga',        '86'),
    ('barcelona',         'FC Barcelona',              'Barça',        'Spain',   'la-liga',        '81'),
    ('atletico-madrid',   'Club Atlético de Madrid',   'Atleti',       'Spain',   'la-liga',        '78'),
    ('athletic-club',     'Athletic Club',             'Athletic',     'Spain',   'la-liga',        '77'),
    ('bayern-munich',     'FC Bayern München',         'Bayern',       'Germany', 'bundesliga',     '5'),
    ('borussia-dortmund', 'Borussia Dortmund',         'Dortmund',     'Germany', 'bundesliga',     '4'),
    ('bayer-leverkusen',  'Bayer 04 Leverkusen',       'Leverkusen',   'Germany', 'bundesliga',     '3'),
    ('rb-leipzig',        'RB Leipzig',                'Leipzig',      'Germany', 'bundesliga',     '721'),
    ('inter',             'FC Internazionale Milano',  'Inter',        'Italy',   'serie-a',        '108'),
    ('ac-milan',          'AC Milan',                  'Milan',        'Italy',   'serie-a',        '98'),
    ('juventus',          'Juventus FC',               'Juve',         'Italy',   'serie-a',        '109'),
    ('napoli',            'SSC Napoli',                'Napoli',       'Italy',   'serie-a',        '113'),
    ('psg',               'Paris Saint-Germain FC',    'PSG',          'France',  'ligue-1',        '524'),
    ('marseille',         'Olympique de Marseille',    'OM',           'France',  'ligue-1',        '516'),
    ('monaco',            'AS Monaco FC',              'Monaco',       'France',  'ligue-1',        '548'),
    ('lyon',              'Olympique Lyonnais',        'OL',           'France',  'ligue-1',        '523')
)
insert into public.teams (slug, name, short_name, country)
select slug, name, short_name, country from seed_teams
on conflict (slug) do nothing;

-- Separate statement: rows written by a CTE are not visible to reads of the
-- same table within one statement, so the mapping insert runs after.
with seed_teams(slug, fd_id, fd_name) as (
  values
    ('arsenal', '57', 'Arsenal FC'), ('manchester-city', '65', 'Manchester City FC'),
    ('liverpool', '64', 'Liverpool FC'), ('chelsea', '61', 'Chelsea FC'),
    ('real-madrid', '86', 'Real Madrid CF'), ('barcelona', '81', 'FC Barcelona'),
    ('atletico-madrid', '78', 'Club Atlético de Madrid'), ('athletic-club', '77', 'Athletic Club'),
    ('bayern-munich', '5', 'FC Bayern München'), ('borussia-dortmund', '4', 'Borussia Dortmund'),
    ('bayer-leverkusen', '3', 'Bayer 04 Leverkusen'), ('rb-leipzig', '721', 'RB Leipzig'),
    ('inter', '108', 'FC Internazionale Milano'), ('ac-milan', '98', 'AC Milan'),
    ('juventus', '109', 'Juventus FC'), ('napoli', '113', 'SSC Napoli'),
    ('psg', '524', 'Paris Saint-Germain FC'), ('marseille', '516', 'Olympique de Marseille'),
    ('monaco', '548', 'AS Monaco FC'), ('lyon', '523', 'Olympique Lyonnais')
)
insert into public.team_sources (canonical_id, source, source_id, source_name, confidence)
select t.id, 'football-data', st.fd_id, st.fd_name, 1.0
from seed_teams st
join public.teams t on t.slug = st.slug
on conflict (source, source_id) do nothing;

-- 3) Matches: per league — 2 finished (yesterday / -3d), 1 live now,
--    1 later today, 2 upcoming. Mapped with source='seed'.
with pairs(comp_slug, home_slug, away_slug, kickoff, status, minute, hs, "as", matchday, seed_key) as (
  values
    -- Premier League
    ('premier-league', 'arsenal',           'chelsea',          now() - interval '1 day',    'finished',  null, 2, 1, 21, 'pl-1'),
    ('premier-league', 'liverpool',          'manchester-city', now() - interval '3 days',   'finished',  null, 1, 1, 20, 'pl-2'),
    ('premier-league', 'manchester-city',    'arsenal',         now() - interval '55 minutes','live',      55,   1, 1, 22, 'pl-3'),
    ('premier-league', 'chelsea',            'liverpool',       now() + interval '4 hours',  'scheduled', null, null, null, 22, 'pl-4'),
    ('premier-league', 'arsenal',            'liverpool',       now() + interval '1 day',    'scheduled', null, null, null, 23, 'pl-5'),
    ('premier-league', 'manchester-city',    'chelsea',         now() + interval '4 days',   'scheduled', null, null, null, 23, 'pl-6'),
    -- La Liga
    ('la-liga', 'real-madrid',     'barcelona',       now() - interval '1 day',    'finished',  null, 3, 2, 21, 'pd-1'),
    ('la-liga', 'atletico-madrid', 'athletic-club',   now() - interval '3 days',   'finished',  null, 0, 0, 20, 'pd-2'),
    ('la-liga', 'barcelona',       'atletico-madrid', now() - interval '30 minutes','live',      30,   1, 0, 22, 'pd-3'),
    ('la-liga', 'athletic-club',   'real-madrid',     now() + interval '6 hours',  'scheduled', null, null, null, 22, 'pd-4'),
    ('la-liga', 'real-madrid',     'atletico-madrid', now() + interval '2 days',   'scheduled', null, null, null, 23, 'pd-5'),
    ('la-liga', 'barcelona',       'athletic-club',   now() + interval '5 days',   'scheduled', null, null, null, 23, 'pd-6'),
    -- Bundesliga
    ('bundesliga', 'bayern-munich',     'borussia-dortmund', now() - interval '1 day',  'finished',  null, 4, 0, 18, 'bl-1'),
    ('bundesliga', 'bayer-leverkusen',  'rb-leipzig',        now() - interval '3 days', 'finished',  null, 2, 2, 17, 'bl-2'),
    ('bundesliga', 'borussia-dortmund', 'bayer-leverkusen',  now() + interval '3 hours','scheduled', null, null, null, 19, 'bl-3'),
    ('bundesliga', 'rb-leipzig',        'bayern-munich',     now() + interval '1 day',  'scheduled', null, null, null, 19, 'bl-4'),
    -- Serie A
    ('serie-a', 'inter',    'ac-milan', now() - interval '1 day',  'finished',  null, 1, 0, 20, 'sa-1'),
    ('serie-a', 'juventus', 'napoli',   now() - interval '3 days', 'finished',  null, 1, 2, 19, 'sa-2'),
    ('serie-a', 'napoli',   'inter',    now() + interval '5 hours','scheduled', null, null, null, 21, 'sa-3'),
    ('serie-a', 'ac-milan', 'juventus', now() + interval '2 days', 'scheduled', null, null, null, 21, 'sa-4'),
    -- Ligue 1
    ('ligue-1', 'psg',       'marseille', now() - interval '1 day',  'finished',  null, 3, 1, 18, 'fl-1'),
    ('ligue-1', 'monaco',    'lyon',      now() - interval '3 days', 'finished',  null, 2, 1, 17, 'fl-2'),
    ('ligue-1', 'marseille', 'monaco',    now() + interval '7 hours','scheduled', null, null, null, 19, 'fl-3'),
    ('ligue-1', 'lyon',      'psg',       now() + interval '3 days', 'scheduled', null, null, null, 19, 'fl-4')
),
ins_matches as (
  insert into public.matches
    (season_id, competition_id, home_team_id, away_team_id, kickoff_utc,
     status, minute, home_score, away_score, matchday)
  select s.id, c.id, ht.id, at.id, p.kickoff, p.status, p.minute, p.hs, p."as", p.matchday
  from pairs p
  join public.competitions c on c.slug = p.comp_slug
  join public.seasons s on s.competition_id = c.id and s.is_current
  join public.teams ht on ht.slug = p.home_slug
  join public.teams at on at.slug = p.away_slug
  where not exists (
    select 1 from public.match_sources ms
    where ms.source = 'seed' and ms.source_id = p.seed_key
  )
  returning id, home_team_id, away_team_id, kickoff_utc
)
insert into public.match_sources (canonical_id, source, source_id, source_name, confidence)
select m.id, 'seed', p.seed_key, p.home_slug || '-v-' || p.away_slug, 1.0
from ins_matches m
join public.teams ht on ht.id = m.home_team_id
join public.teams at on at.id = m.away_team_id
join pairs p on p.home_slug = ht.slug and p.away_slug = at.slug
on conflict (source, source_id) do nothing;

-- 4) Match events for finished + live matches (players left null; scorer in detail).
with ev(seed_key, minute, type, team_slug, detail) as (
  values
    ('pl-1', 23, 'goal',   'arsenal',        'Goal — Saka'),
    ('pl-1', 58, 'goal',   'arsenal',        'Goal — Ødegaard'),
    ('pl-1', 71, 'goal',   'chelsea',        'Goal — Palmer'),
    ('pl-1', 84, 'yellow', 'chelsea',        'Booking — Caicedo'),
    ('pl-3', 12, 'goal',   'manchester-city','Goal — Haaland'),
    ('pl-3', 44, 'goal',   'arsenal',        'Goal — Havertz'),
    ('pd-1', 15, 'goal',   'real-madrid',    'Goal — Mbappé'),
    ('pd-1', 33, 'goal',   'barcelona',      'Goal — Yamal'),
    ('pd-1', 49, 'goal',   'real-madrid',    'Goal — Vinícius Júnior'),
    ('pd-1', 66, 'goal',   'barcelona',      'Goal — Lewandowski'),
    ('pd-1', 88, 'goal',   'real-madrid',    'Goal — Bellingham'),
    ('pd-3', 27, 'goal',   'barcelona',      'Goal — Raphinha'),
    ('bl-1',  9, 'goal',   'bayern-munich',  'Goal — Kane'),
    ('bl-1', 34, 'goal',   'bayern-munich',  'Goal — Musiala'),
    ('bl-1', 60, 'goal',   'bayern-munich',  'Goal — Kane'),
    ('bl-1', 78, 'goal',   'bayern-munich',  'Goal — Olise'),
    ('sa-1', 52, 'goal',   'inter',          'Goal — Lautaro Martínez'),
    ('fl-1', 19, 'goal',   'psg',            'Goal — Dembélé'),
    ('fl-1', 40, 'goal',   'marseille',      'Goal — Aubameyang'),
    ('fl-1', 63, 'goal',   'psg',            'Goal — Barcola'),
    ('fl-1', 90, 'goal',   'psg',            'Goal — Ramos')
)
insert into public.match_events (match_id, minute, type, team_id, detail)
select ms.canonical_id, e.minute, e.type, t.id, e.detail
from ev e
join public.match_sources ms on ms.source = 'seed' and ms.source_id = e.seed_key
join public.teams t on t.slug = e.team_slug
where not exists (
  select 1 from public.match_events me
  where me.match_id = ms.canonical_id and me.minute = e.minute and me.detail = e.detail
);

-- 5) Standings (4 rows per league).
with st(comp_slug, team_slug, position, played, won, drawn, lost, gf, ga, points, form) as (
  values
    ('premier-league', 'arsenal',           1, 21, 15, 4, 2, 48, 18, 49, 'WWDWW'),
    ('premier-league', 'liverpool',          2, 21, 14, 5, 2, 50, 22, 47, 'WDWWD'),
    ('premier-league', 'manchester-city',    3, 21, 13, 5, 3, 46, 21, 44, 'DWWLW'),
    ('premier-league', 'chelsea',            4, 21, 11, 6, 4, 41, 26, 39, 'LWDWW'),
    ('la-liga', 'real-madrid',     1, 21, 16, 3, 2, 51, 19, 51, 'WWWDW'),
    ('la-liga', 'barcelona',       2, 21, 15, 3, 3, 55, 25, 48, 'WLWWW'),
    ('la-liga', 'atletico-madrid', 3, 21, 13, 6, 2, 38, 16, 45, 'DWWDW'),
    ('la-liga', 'athletic-club',   4, 21, 11, 5, 5, 33, 22, 38, 'WDLWD'),
    ('bundesliga', 'bayern-munich',     1, 17, 14, 2, 1, 55, 14, 44, 'WWWWW'),
    ('bundesliga', 'bayer-leverkusen',  2, 17, 11, 4, 2, 39, 20, 37, 'WDWWD'),
    ('bundesliga', 'rb-leipzig',        3, 17, 10, 3, 4, 34, 21, 33, 'LWDWW'),
    ('bundesliga', 'borussia-dortmund', 4, 17,  9, 4, 4, 35, 25, 31, 'WLWDL'),
    ('serie-a', 'inter',    1, 20, 14, 4, 2, 44, 15, 46, 'WWDWW'),
    ('serie-a', 'napoli',   2, 20, 14, 3, 3, 36, 16, 45, 'WWWLW'),
    ('serie-a', 'juventus', 3, 20, 11, 7, 2, 33, 17, 40, 'DWDWL'),
    ('serie-a', 'ac-milan', 4, 20, 10, 6, 4, 35, 24, 36, 'LDWWD'),
    ('ligue-1', 'psg',       1, 18, 15, 2, 1, 52, 15, 47, 'WWWWD'),
    ('ligue-1', 'monaco',    2, 18, 11, 3, 4, 38, 22, 36, 'WLWWW'),
    ('ligue-1', 'marseille', 3, 18, 10, 4, 4, 36, 23, 34, 'DWLWW'),
    ('ligue-1', 'lyon',      4, 18,  9, 4, 5, 30, 22, 31, 'WDLDW')
)
insert into public.standings
  (season_id, team_id, position, played, won, drawn, lost, gf, ga, gd, points, form)
select s.id, t.id, st.position, st.played, st.won, st.drawn, st.lost,
       st.gf, st.ga, st.gf - st.ga, st.points, st.form
from st
join public.competitions c on c.slug = st.comp_slug
join public.seasons s on s.competition_id = c.id and s.is_current
join public.teams t on t.slug = st.team_slug
on conflict (season_id, team_id) do update set
  position = excluded.position, played = excluded.played, won = excluded.won,
  drawn = excluded.drawn, lost = excluded.lost, gf = excluded.gf,
  ga = excluded.ga, gd = excluded.gd, points = excluded.points, form = excluded.form;
