// Ingestion pipeline: adapter.fetch → normalize → resolveEntities → upsert.
// The Store interface abstracts all DB access so this logic is unit-testable
// under Node with a fake store, and runs under Deno with the Supabase store.

import {
  footballDataAdapter,
  normalizeSeason,
  slugifyTeam,
} from './adapters/football-data.ts';
import type {
  NormalizedSeason,
  NormalizedStandingRow,
} from './adapters/types.ts';

export interface CompetitionRef {
  fdCode: string;
  slug: string;
  canonicalId: string;
  // Current season if one exists; ingestion bootstraps one from the upstream
  // payload when null.
  seasonId: string | null;
}

export interface MatchSnapshot {
  status: string;
  minute: number | null;
  homeScore: number | null;
  awayScore: number | null;
  kickoffUtc: string;
  matchday: number | null;
  stage: string | null;
}

export interface MatchUpsert extends MatchSnapshot {
  sourceId: string;
  competitionId: string;
  seasonId: string;
  homeTeamId: string;
  awayTeamId: string;
}

export interface StandingUpsert {
  seasonId: string;
  teamId: string;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  form: string | null;
}

export interface NewTeam {
  slug: string;
  name: string;
  shortName: string | null;
  country: string | null;
  crestUrl: string | null;
}

// All DB access the pipeline needs. A Store instance is bound to ONE source
// (see createStore) — the single place source identity lives, so mapping
// tables can never receive mixed-source rows in a run.
export interface Store {
  readonly source: string;
  mappedCompetitions(): Promise<CompetitionRef[]>;
  ensureSeason(competitionId: string, season: NormalizedSeason): Promise<string>;
  teamMap(): Promise<Map<string, string>>; // source_id → canonical team id
  matchMap(): Promise<Map<string, string>>; // source_id → canonical match id
  existingMatches(ids: string[]): Promise<Map<string, MatchSnapshot>>;
  createTeam(team: NewTeam, sourceId: string): Promise<string>;
  upsertMatch(match: MatchUpsert): Promise<string>;
  upsertStandings(rows: StandingUpsert[]): Promise<number>;
}

export interface RunResult {
  status: 'success' | 'error' | 'skipped';
  rowsUpserted: number;
  error?: string;
}

export interface RunDeps {
  apiKey: string | undefined;
  fetchJson: (url: string, apiKey: string) => Promise<unknown>;
  store: Store;
  sleep: (ms: number) => Promise<void>;
  // football-data free tier: 10 req/min. Space calls out with headroom.
  spacingMs?: number;
}

export function matchChanged(a: MatchSnapshot, b: MatchSnapshot): boolean {
  return (
    a.status !== b.status ||
    a.minute !== b.minute ||
    a.homeScore !== b.homeScore ||
    a.awayScore !== b.awayScore ||
    a.matchday !== b.matchday ||
    a.stage !== b.stage ||
    new Date(a.kickoffUtc).getTime() !== new Date(b.kickoffUtc).getTime()
  );
}

// Prefer the season named by the upstream payload (keeps dates fresh and
// handles season rollover); fall back to the DB's current season.
async function resolveSeason(
  comp: CompetitionRef,
  raw: unknown,
  store: Store,
): Promise<string | null> {
  const season: NormalizedSeason | null = normalizeSeason(raw);
  if (season) return store.ensureSeason(comp.canonicalId, season);
  return comp.seasonId;
}

async function resolveTeam(
  sourceId: string,
  name: string,
  shortName: string | null,
  crest: string | null,
  teams: Map<string, string>,
  store: Store,
): Promise<string> {
  const existing = teams.get(sourceId);
  if (existing) return existing;
  const id = await store.createTeam(
    { slug: slugifyTeam(name), name, shortName, country: null, crestUrl: crest },
    sourceId,
  );
  teams.set(sourceId, id); // dedupe within this run
  return id;
}

export async function ingestFixtures(deps: RunDeps): Promise<RunResult> {
  if (!deps.apiKey) {
    return {
      status: 'skipped',
      rowsUpserted: 0,
      error: 'skipped: missing FOOTBALL_DATA_API_KEY',
    };
  }
  const { store, fetchJson, apiKey, sleep } = deps;
  const spacing = deps.spacingMs ?? 6500;
  const comps = await store.mappedCompetitions();
  const teams = await store.teamMap();
  const matchIds = await store.matchMap();
  let rows = 0;

  for (let i = 0; i < comps.length; i++) {
    const comp = comps[i];
    if (i > 0) await sleep(spacing);
    const raw = await fetchJson(footballDataAdapter.matchesUrl(comp.fdCode), apiKey);
    const seasonId = await resolveSeason(comp, raw, store);
    if (!seasonId) continue; // no season info anywhere — nothing to attach to
    const normalized = footballDataAdapter.normalizeMatches(raw);

    const known = normalized
      .map((m) => matchIds.get(m.sourceId))
      .filter((id): id is string => Boolean(id));
    const snapshots = await store.existingMatches(known);

    for (const m of normalized) {
      const next: MatchSnapshot = {
        status: m.status,
        minute: m.minute,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        kickoffUtc: m.kickoffUtc,
        matchday: m.matchday,
        stage: m.stage,
      };
      const existingId = matchIds.get(m.sourceId);
      if (existingId) {
        const prev = snapshots.get(existingId);
        if (prev && !matchChanged(prev, next)) continue; // unchanged → skip
      }

      const homeTeamId = await resolveTeam(
        m.homeSourceId, m.homeName, m.homeShortName, m.homeCrest, teams, store,
      );
      const awayTeamId = await resolveTeam(
        m.awaySourceId, m.awayName, m.awayShortName, m.awayCrest, teams, store,
      );
      const id = await store.upsertMatch({
        ...next,
        sourceId: m.sourceId,
        competitionId: comp.canonicalId,
        seasonId,
        homeTeamId,
        awayTeamId,
      });
      matchIds.set(m.sourceId, id);
      rows++;
    }
  }
  return { status: 'success', rowsUpserted: rows };
}

export async function ingestStandings(deps: RunDeps): Promise<RunResult> {
  if (!deps.apiKey) {
    return {
      status: 'skipped',
      rowsUpserted: 0,
      error: 'skipped: missing FOOTBALL_DATA_API_KEY',
    };
  }
  const { store, fetchJson, apiKey, sleep } = deps;
  const spacing = deps.spacingMs ?? 6500;
  const comps = await store.mappedCompetitions();
  const teams = await store.teamMap();
  let rows = 0;

  for (let i = 0; i < comps.length; i++) {
    const comp = comps[i];
    if (i > 0) await sleep(spacing);
    const raw = await fetchJson(footballDataAdapter.standingsUrl(comp.fdCode), apiKey);
    const seasonId = await resolveSeason(comp, raw, store);
    if (!seasonId) continue;
    const normalized: NormalizedStandingRow[] =
      footballDataAdapter.normalizeStandings(raw);

    const upserts: StandingUpsert[] = [];
    for (const r of normalized) {
      const teamId = await resolveTeam(
        r.teamSourceId, r.teamName, r.teamShortName, r.crestUrl, teams, store,
      );
      upserts.push({
        seasonId,
        teamId,
        position: r.position,
        played: r.played,
        won: r.won,
        drawn: r.drawn,
        lost: r.lost,
        gf: r.gf,
        ga: r.ga,
        gd: r.gd,
        points: r.points,
        form: r.form,
      });
    }
    rows += await store.upsertStandings(upserts);
  }
  return { status: 'success', rowsUpserted: rows };
}
