import { describe, expect, it } from 'vitest';
import {
  matchesUrl,
  normalizeMatches,
  normalizeStandings,
  slugifyTeam,
  standingsUrl,
} from '../supabase/functions/_shared/adapters/football-data';
import matchesFixture from './fixtures/football-data/matches.json';
import standingsFixture from './fixtures/football-data/standings.json';

describe('football-data adapter — normalizeMatches', () => {
  const rows = normalizeMatches(matchesFixture);

  it('normalizes every match in the payload', () => {
    expect(rows).toHaveLength(3);
  });

  it('maps FINISHED to finished with full-time scores', () => {
    const finished = rows.find((m) => m.sourceId === '497001');
    expect(finished).toMatchObject({
      status: 'finished',
      homeScore: 2,
      awayScore: 1,
      kickoffUtc: '2026-01-10T15:00:00Z',
      matchday: 21,
      homeSourceId: '57',
      awaySourceId: '61',
      homeName: 'Arsenal FC',
    });
  });

  it('maps IN_PLAY to live with the running minute', () => {
    const live = rows.find((m) => m.sourceId === '497002');
    expect(live).toMatchObject({ status: 'live', minute: 55, homeScore: 1, awayScore: 1 });
  });

  it('maps TIMED to scheduled with null scores', () => {
    const upcoming = rows.find((m) => m.sourceId === '497003');
    expect(upcoming).toMatchObject({
      status: 'scheduled',
      minute: null,
      homeScore: null,
      awayScore: null,
    });
  });
});

describe('football-data adapter — normalizeStandings', () => {
  const rows = normalizeStandings(standingsFixture);

  it('uses only the TOTAL table', () => {
    expect(rows).toHaveLength(3);
  });

  it('maps a standings row including compacted form', () => {
    expect(rows[0]).toEqual({
      teamSourceId: '57',
      teamName: 'Arsenal FC',
      teamShortName: 'Arsenal',
      crestUrl: 'https://crests.football-data.org/57.png',
      position: 1,
      played: 21,
      won: 15,
      drawn: 4,
      lost: 2,
      gf: 48,
      ga: 18,
      gd: 30,
      points: 49,
      form: 'WWDWW',
    });
  });

  it('handles a null form field', () => {
    expect(rows[2]?.form).toBeNull();
  });
});

describe('football-data adapter — url builders + slugs', () => {
  it('builds competition endpoints', () => {
    expect(matchesUrl('PL')).toBe('https://api.football-data.org/v4/competitions/PL/matches');
    expect(standingsUrl('BL1')).toBe('https://api.football-data.org/v4/competitions/BL1/standings');
  });

  it('slugifies team names (strips FC/CF/AFC suffixes, accents, punctuation)', () => {
    expect(slugifyTeam('Arsenal FC')).toBe('arsenal');
    expect(slugifyTeam('FC Bayern München')).toBe('bayern-munchen');
    expect(slugifyTeam('Club Atlético de Madrid')).toBe('club-atletico-de-madrid');
    expect(slugifyTeam('AFC Bournemouth')).toBe('bournemouth');
  });
});
