import { supabase } from './supabase';

// Shared select fragments keep the shape consistent across pages.
const MATCH_SELECT = `
  id, status, minute, home_score, away_score, kickoff_utc, matchday, stage,
  competition:competitions ( slug, name ),
  home_team:teams!matches_home_team_id_fkey ( slug, name, short_name, crest_url ),
  away_team:teams!matches_away_team_id_fkey ( slug, name, short_name, crest_url )
` as const;

function unwrap<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(`Supabase query failed: ${error.message}`);
  if (data === null) throw new Error('Supabase query returned no data');
  return data;
}

export type MatchRow = Awaited<ReturnType<typeof todayFixtures>>[number];

// Fixtures within the local "today" window (UTC day, padded to catch late KOs).
export async function todayFixtures() {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  const { data, error } = await supabase
    .from('matches')
    .select(MATCH_SELECT)
    .gte('kickoff_utc', start.toISOString())
    .lt('kickoff_utc', end.toISOString())
    .order('kickoff_utc', { ascending: true });
  return unwrap(data, error);
}

export async function allCompetitions() {
  const { data, error } = await supabase
    .from('competitions')
    .select('id, slug, name, type, country, confederation, tier')
    .order('tier', { ascending: true })
    .order('name', { ascending: true });
  return unwrap(data, error);
}

// Competitions that have a current season (i.e. have data worth browsing).
export async function activeCompetitions() {
  const { data, error } = await supabase
    .from('seasons')
    .select('id, year_label, competition:competitions ( id, slug, name, country )')
    .eq('is_current', true);
  return unwrap(data, error);
}

export async function competitionDetail(slug: string) {
  const { data: comp, error: compError } = await supabase
    .from('competitions')
    .select('id, slug, name, type, country, confederation, tier')
    .eq('slug', slug)
    .maybeSingle();
  if (compError) throw new Error(`Supabase query failed: ${compError.message}`);
  if (!comp) return null;

  const { data: season, error: seasonError } = await supabase
    .from('seasons')
    .select('id, year_label, start_date, end_date')
    .eq('competition_id', comp.id)
    .eq('is_current', true)
    .maybeSingle();
  if (seasonError) throw new Error(`Supabase query failed: ${seasonError.message}`);

  const [standings, matches] = season
    ? await Promise.all([
        supabase
          .from('standings')
          .select(
            'position, played, won, drawn, lost, gf, ga, gd, points, form, team:teams ( slug, name, short_name, crest_url )',
          )
          .eq('season_id', season.id)
          .order('position', { ascending: true })
          .then((r) => unwrap(r.data, r.error)),
        supabase
          .from('matches')
          .select(MATCH_SELECT)
          .eq('season_id', season.id)
          .order('kickoff_utc', { ascending: true })
          .then((r) => unwrap(r.data, r.error)),
      ])
    : [[], []];

  return { competition: comp, season, standings, matches };
}

export async function allTeams() {
  const { data, error } = await supabase
    .from('teams')
    .select('id, slug, name, short_name, country, crest_url')
    .order('name', { ascending: true });
  return unwrap(data, error);
}

export async function teamDetail(slug: string) {
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('id, slug, name, short_name, country, crest_url')
    .eq('slug', slug)
    .maybeSingle();
  if (teamError) throw new Error(`Supabase query failed: ${teamError.message}`);
  if (!team) return null;

  const [matches, standing] = await Promise.all([
    supabase
      .from('matches')
      .select(MATCH_SELECT)
      .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
      .order('kickoff_utc', { ascending: true })
      .then((r) => unwrap(r.data, r.error)),
    supabase
      .from('standings')
      .select(
        'position, played, won, drawn, lost, gf, ga, gd, points, form, season:seasons ( year_label, is_current, competition:competitions ( slug, name ) )',
      )
      .eq('team_id', team.id)
      .then((r) => unwrap(r.data, r.error)),
  ]);

  return {
    team,
    matches,
    standing: standing.find((s) => s.season?.is_current) ?? standing[0] ?? null,
  };
}

export async function allMatchIds() {
  const { data, error } = await supabase.from('matches').select('id');
  return unwrap(data, error);
}

export async function matchDetail(id: string) {
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select(
      `${MATCH_SELECT},
       season:seasons ( id, year_label ),
       venue:venues ( name, city )`,
    )
    .eq('id', id)
    .maybeSingle();
  if (matchError) throw new Error(`Supabase query failed: ${matchError.message}`);
  if (!match) return null;

  const events = await supabase
    .from('match_events')
    .select('id, minute, type, detail, team:teams ( slug, short_name, name )')
    .eq('match_id', id)
    .order('minute', { ascending: true })
    .then((r) => unwrap(r.data, r.error));

  const standingsContext = match.season
    ? await supabase
        .from('standings')
        .select(
          'position, played, gd, points, team:teams ( slug, name, short_name )',
        )
        .eq('season_id', match.season.id)
        .order('position', { ascending: true })
        .then((r) => unwrap(r.data, r.error))
    : [];

  return { match, events, standingsContext };
}
