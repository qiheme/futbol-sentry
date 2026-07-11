// football-data.org v4 adapter. Pure functions — no network, no Deno APIs —
// so it runs unchanged under both Deno (edge functions) and Node (vitest).

import type {
  MatchStatus,
  NormalizedMatch,
  NormalizedStandingRow,
  SourceAdapter,
} from './types.ts';

const BASE = 'https://api.football-data.org/v4';

export function matchesUrl(code: string): string {
  return `${BASE}/competitions/${code}/matches`;
}

export function standingsUrl(code: string): string {
  return `${BASE}/competitions/${code}/standings`;
}

// football-data status enum → our canonical status.
function mapStatus(status: string): MatchStatus {
  switch (status) {
    case 'IN_PLAY':
    case 'PAUSED':
      return 'live';
    case 'FINISHED':
    case 'AWARDED':
      return 'finished';
    case 'POSTPONED':
    case 'SUSPENDED':
    case 'CANCELLED':
      return 'postponed';
    default:
      // SCHEDULED, TIMED
      return 'scheduled';
  }
}

const num = (v: unknown): number | null =>
  typeof v === 'number' ? v : null;

// "W,W,D,L,W" | "WWDLW" | null → "WWDLW" | null
function compactForm(form: unknown): string | null {
  if (typeof form !== 'string' || form.length === 0) return null;
  const letters = form.toUpperCase().replace(/[^WDL]/g, '');
  return letters.length > 0 ? letters : null;
}

export function slugifyTeam(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/\b(FC|CF|AFC|SC|AC|SSC|SS|CD|RC)\b/gi, ' ') // common club suffixes/prefixes
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface RawTeam {
  id: number;
  name: string;
  shortName?: string | null;
  crest?: string | null;
}

export function normalizeMatches(raw: unknown): NormalizedMatch[] {
  const payload = raw as { matches?: unknown[] };
  const matches = Array.isArray(payload?.matches) ? payload.matches : [];
  return matches.map((entry) => {
    const m = entry as {
      id: number;
      utcDate: string;
      status: string;
      minute?: number | null;
      matchday?: number | null;
      stage?: string | null;
      homeTeam: RawTeam;
      awayTeam: RawTeam;
      score?: { fullTime?: { home?: number | null; away?: number | null } };
    };
    const status = mapStatus(m.status);
    return {
      sourceId: String(m.id),
      status,
      minute: status === 'live' ? num(m.minute) : null,
      kickoffUtc: m.utcDate,
      homeScore: num(m.score?.fullTime?.home),
      awayScore: num(m.score?.fullTime?.away),
      matchday: num(m.matchday),
      stage: m.stage ?? null,
      homeSourceId: String(m.homeTeam.id),
      awaySourceId: String(m.awayTeam.id),
      homeName: m.homeTeam.name,
      awayName: m.awayTeam.name,
      homeShortName: m.homeTeam.shortName ?? null,
      awayShortName: m.awayTeam.shortName ?? null,
      homeCrest: m.homeTeam.crest ?? null,
      awayCrest: m.awayTeam.crest ?? null,
    };
  });
}

export function normalizeStandings(raw: unknown): NormalizedStandingRow[] {
  const payload = raw as {
    standings?: { type?: string; table?: unknown[] }[];
  };
  const total = (payload?.standings ?? []).find((s) => s.type === 'TOTAL');
  const table = Array.isArray(total?.table) ? total.table : [];
  return table.map((entry) => {
    const r = entry as {
      position: number;
      team: RawTeam;
      playedGames: number;
      form?: string | null;
      won: number;
      draw: number;
      lost: number;
      points: number;
      goalsFor: number;
      goalsAgainst: number;
      goalDifference: number;
    };
    return {
      teamSourceId: String(r.team.id),
      teamName: r.team.name,
      teamShortName: r.team.shortName ?? null,
      crestUrl: r.team.crest ?? null,
      position: r.position,
      played: r.playedGames,
      won: r.won,
      drawn: r.draw,
      lost: r.lost,
      gf: r.goalsFor,
      ga: r.goalsAgainst,
      gd: r.goalDifference,
      points: r.points,
      form: compactForm(r.form),
    };
  });
}

export const footballDataAdapter: SourceAdapter = {
  source: 'football-data',
  matchesUrl,
  standingsUrl,
  normalizeMatches,
  normalizeStandings,
};
