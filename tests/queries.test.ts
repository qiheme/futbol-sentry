import { describe, expect, it } from 'vitest';
import {
  formatKickoff,
  groupByCompetition,
  matchStatusLabel,
  parseForm,
} from '../src/lib/helpers';

const match = (over: Record<string, unknown> = {}) => ({
  id: 'm1',
  status: 'scheduled',
  minute: null as number | null,
  home_score: null as number | null,
  away_score: null as number | null,
  kickoff_utc: '2026-07-11T15:00:00Z',
  competition: { slug: 'premier-league', name: 'Premier League' },
  ...over,
});

describe('matchStatusLabel', () => {
  it('shows kickoff time for scheduled matches', () => {
    expect(matchStatusLabel(match())).toMatchObject({ kind: 'scheduled' });
  });

  it("shows LIVE with the current minute for live matches", () => {
    const m = match({ status: 'live', minute: 55, home_score: 1, away_score: 1 });
    expect(matchStatusLabel(m)).toEqual({ kind: 'live', text: "55'" });
  });

  it('shows FT for finished matches', () => {
    const m = match({ status: 'finished', home_score: 2, away_score: 1 });
    expect(matchStatusLabel(m)).toEqual({ kind: 'finished', text: 'FT' });
  });

  it('shows Postponed for postponed matches', () => {
    expect(matchStatusLabel(match({ status: 'postponed' }))).toEqual({
      kind: 'postponed',
      text: 'Postponed',
    });
  });
});

describe('groupByCompetition', () => {
  it('groups matches by competition preserving kickoff order inside groups', () => {
    const rows = [
      match({ id: 'a', kickoff_utc: '2026-07-11T15:00:00Z' }),
      match({
        id: 'b',
        kickoff_utc: '2026-07-11T13:00:00Z',
        competition: { slug: 'la-liga', name: 'La Liga' },
      }),
      match({ id: 'c', kickoff_utc: '2026-07-11T17:30:00Z' }),
    ];
    const groups = groupByCompetition(rows);
    expect(groups.map((g) => g.competition.slug)).toEqual([
      'premier-league',
      'la-liga',
    ]);
    expect(groups[0]?.matches.map((m) => m.id)).toEqual(['a', 'c']);
  });

  it('returns an empty list for no matches', () => {
    expect(groupByCompetition([])).toEqual([]);
  });
});

describe('parseForm', () => {
  it('splits a form string into results, most recent last', () => {
    expect(parseForm('WWDLW')).toEqual(['W', 'W', 'D', 'L', 'W']);
  });

  it('ignores unknown characters and handles null', () => {
    expect(parseForm('W-D,L')).toEqual(['W', 'D', 'L']);
    expect(parseForm(null)).toEqual([]);
  });
});

describe('formatKickoff', () => {
  it('formats an ISO timestamp as a UTC HH:MM label', () => {
    expect(formatKickoff('2026-07-11T15:00:00Z')).toBe('15:00');
  });

  it('formats midnight and single-digit hours with padding', () => {
    expect(formatKickoff('2026-07-11T05:05:00Z')).toBe('05:05');
  });
});
