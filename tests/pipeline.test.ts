import { describe, expect, it, vi } from 'vitest';
import type {
  CompetitionRef,
  MatchSnapshot,
  Store,
} from '../supabase/functions/_shared/pipeline';
import {
  ingestFixtures,
  ingestStandings,
  matchChanged,
} from '../supabase/functions/_shared/pipeline';
import matchesFixture from './fixtures/football-data/matches.json';
import standingsFixture from './fixtures/football-data/standings.json';

const COMP: CompetitionRef = {
  fdCode: 'PL',
  slug: 'premier-league',
  canonicalId: 'comp-uuid',
  seasonId: 'season-uuid',
};

function fakeStore(overrides: Partial<Store> = {}): Store {
  const teamMap = new Map<string, string>([
    ['57', 'team-arsenal'],
    ['61', 'team-chelsea'],
    ['64', 'team-liverpool'],
    ['65', 'team-city'],
  ]);
  return {
    currentCompetitions: vi.fn(async () => [COMP]),
    teamMap: vi.fn(async () => new Map(teamMap)),
    matchMap: vi.fn(async () => new Map()),
    existingMatches: vi.fn(async () => new Map<string, MatchSnapshot>()),
    createTeam: vi.fn(async (t) => `created-${t.slug}`),
    upsertMatch: vi.fn(async () => 'match-uuid'),
    upsertStandings: vi.fn(async (rows) => rows.length),
    ...overrides,
  };
}

const fetchJson = (payload: unknown) => vi.fn(async () => payload);

describe('ingestFixtures', () => {
  it('skips gracefully when the API key is missing', async () => {
    const store = fakeStore();
    const fetcher = fetchJson(matchesFixture);
    const result = await ingestFixtures({
      apiKey: undefined,
      fetchJson: fetcher,
      store,
      sleep: async () => {},
    });
    expect(result.status).toBe('skipped');
    expect(result.error).toContain('FOOTBALL_DATA_API_KEY');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('creates unknown teams once and upserts matches with resolved ids', async () => {
    const store = fakeStore();
    const result = await ingestFixtures({
      apiKey: 'key',
      fetchJson: fetchJson(matchesFixture),
      store,
      sleep: async () => {},
    });

    expect(result.status).toBe('success');
    // Nottingham Forest (id 351) is not in the team map → created exactly once.
    expect(store.createTeam).toHaveBeenCalledTimes(1);
    expect(store.createTeam).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'nottingham-forest', name: 'Nottingham Forest FC' }),
      'football-data',
      '351',
    );
    expect(store.upsertMatch).toHaveBeenCalledTimes(3);
    expect(store.upsertMatch).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceId: '497001',
        homeTeamId: 'team-arsenal',
        awayTeamId: 'team-chelsea',
        competitionId: 'comp-uuid',
        seasonId: 'season-uuid',
        status: 'finished',
      }),
    );
    expect(result.rowsUpserted).toBe(3);
  });

  it('skips unchanged matches (changed-row detection)', async () => {
    const unchanged: MatchSnapshot = {
      status: 'finished',
      minute: null,
      homeScore: 2,
      awayScore: 1,
      kickoffUtc: '2026-01-10T15:00:00.000Z',
    };
    const store = fakeStore({
      matchMap: vi.fn(async () => new Map([['497001', 'match-1']])),
      existingMatches: vi.fn(async () => new Map([['match-1', unchanged]])),
    });
    const result = await ingestFixtures({
      apiKey: 'key',
      fetchJson: fetchJson(matchesFixture),
      store,
      sleep: async () => {},
    });
    // 497001 unchanged → only the other two upserted.
    expect(store.upsertMatch).toHaveBeenCalledTimes(2);
    expect(result.rowsUpserted).toBe(2);
  });
});

describe('ingestStandings', () => {
  it('upserts one row per TOTAL table entry with resolved team ids', async () => {
    const store = fakeStore();
    const result = await ingestStandings({
      apiKey: 'key',
      fetchJson: fetchJson(standingsFixture),
      store,
      sleep: async () => {},
    });
    expect(result.status).toBe('success');
    expect(store.upsertStandings).toHaveBeenCalledTimes(1);
    const rows = vi.mocked(store.upsertStandings).mock.calls[0]?.[0];
    expect(rows).toHaveLength(3);
    expect(rows?.[0]).toMatchObject({
      seasonId: 'season-uuid',
      teamId: 'team-arsenal',
      position: 1,
      points: 49,
      form: 'WWDWW',
    });
    expect(result.rowsUpserted).toBe(3);
  });

  it('skips gracefully when the API key is missing', async () => {
    const result = await ingestStandings({
      apiKey: '',
      fetchJson: fetchJson(standingsFixture),
      store: fakeStore(),
      sleep: async () => {},
    });
    expect(result.status).toBe('skipped');
  });
});

describe('matchChanged', () => {
  const snapshot: MatchSnapshot = {
    status: 'live',
    minute: 55,
    homeScore: 1,
    awayScore: 1,
    kickoffUtc: '2026-01-17T17:30:00.000Z',
  };

  it('detects score/minute/status changes', () => {
    expect(matchChanged(snapshot, { ...snapshot, minute: 56 })).toBe(true);
    expect(matchChanged(snapshot, { ...snapshot, homeScore: 2 })).toBe(true);
    expect(matchChanged(snapshot, { ...snapshot, status: 'finished' })).toBe(true);
  });

  it('treats equal timestamps with different ISO formats as unchanged', () => {
    expect(
      matchChanged(snapshot, { ...snapshot, kickoffUtc: '2026-01-17T17:30:00Z' }),
    ).toBe(false);
  });
});
