// Source adapter contract. Phase 1 has one implementation (football-data);
// Phase 2 adds ESPN behind the same shape so the pipeline stays source-agnostic.

export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'postponed';

export interface NormalizedMatch {
  sourceId: string;
  status: MatchStatus;
  minute: number | null;
  kickoffUtc: string;
  homeScore: number | null;
  awayScore: number | null;
  matchday: number | null;
  stage: string | null;
  homeSourceId: string;
  awaySourceId: string;
  homeName: string;
  awayName: string;
  homeShortName: string | null;
  awayShortName: string | null;
  homeCrest: string | null;
  awayCrest: string | null;
}

export interface NormalizedSeason {
  sourceId: string;
  startDate: string | null;
  endDate: string | null;
  yearLabel: string;
}

export interface NormalizedStandingRow {
  teamSourceId: string;
  teamName: string;
  teamShortName: string | null;
  crestUrl: string | null;
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

export interface SourceAdapter {
  readonly source: string;
  matchesUrl(code: string): string;
  standingsUrl(code: string): string;
  normalizeMatches(raw: unknown): NormalizedMatch[];
  normalizeStandings(raw: unknown): NormalizedStandingRow[];
}
