// Supabase-backed Store implementation for the ingestion pipeline. Deno only:
// uses the service-role key (injected as env) so writes bypass RLS.
// A Store instance is bound to ONE source — the closure is the single place
// source identity lives (see Store in pipeline.ts).

import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import type { NormalizedSeason } from './adapters/types.ts';
import type {
  CompetitionRef,
  MatchSnapshot,
  MatchUpsert,
  NewTeam,
  StandingUpsert,
  Store,
} from './pipeline.ts';

export function serviceClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export function createStore(db: SupabaseClient, source: string): Store {
  return {
    source,

    // Every competition mapped for this source, with its current season id if
    // one exists. Competitions without a season are still returned — the
    // pipeline bootstraps a season from the upstream payload (ensureSeason).
    async mappedCompetitions(): Promise<CompetitionRef[]> {
      const { data, error } = await db
        .from('competition_sources')
        .select(
          'source_id, competition:competitions!inner ( id, slug, seasons ( id, is_current ) )',
        )
        .eq('source', source);
      if (error) throw error;

      const refs: CompetitionRef[] = [];
      for (const row of data ?? []) {
        const comp = (row as any).competition;
        if (!comp) continue;
        const current = (comp.seasons ?? []).find((s: any) => s.is_current);
        refs.push({
          fdCode: (row as any).source_id,
          slug: comp.slug,
          canonicalId: comp.id,
          seasonId: current?.id ?? null,
        });
      }
      return refs;
    },

    // Upsert the season named by the upstream payload and make it the only
    // current season for the competition. Atomic ON CONFLICT upsert: the
    // fixtures and standings crons both fire at minute 0, so two runs can
    // bootstrap the same season concurrently — select-then-insert would race
    // on the (competition_id, year_label) unique constraint.
    async ensureSeason(
      competitionId: string,
      season: NormalizedSeason,
    ): Promise<string> {
      const { data, error } = await db
        .from('seasons')
        .upsert(
          {
            competition_id: competitionId,
            year_label: season.yearLabel,
            start_date: season.startDate,
            end_date: season.endDate,
            is_current: true,
          },
          { onConflict: 'competition_id,year_label' },
        )
        .select('id')
        .single();
      if (error) throw error;
      const seasonId = data.id as string;

      // Exactly one current season per competition (queries use maybeSingle).
      const { error: clearError } = await db
        .from('seasons')
        .update({ is_current: false })
        .eq('competition_id', competitionId)
        .neq('id', seasonId)
        .eq('is_current', true);
      if (clearError) throw clearError;
      return seasonId;
    },

    async teamMap(): Promise<Map<string, string>> {
      const { data, error } = await db
        .from('team_sources')
        .select('source_id, canonical_id')
        .eq('source', source);
      if (error) throw error;
      return new Map((data ?? []).map((r: any) => [r.source_id, r.canonical_id]));
    },

    async matchMap(): Promise<Map<string, string>> {
      const { data, error } = await db
        .from('match_sources')
        .select('source_id, canonical_id')
        .eq('source', source);
      if (error) throw error;
      return new Map((data ?? []).map((r: any) => [r.source_id, r.canonical_id]));
    },

    async existingMatches(ids: string[]): Promise<Map<string, MatchSnapshot>> {
      if (ids.length === 0) return new Map();
      const { data, error } = await db
        .from('matches')
        .select('id, status, minute, home_score, away_score, kickoff_utc, matchday, stage')
        .in('id', ids);
      if (error) throw error;
      return new Map(
        (data ?? []).map((r: any) => [
          r.id,
          {
            status: r.status,
            minute: r.minute,
            homeScore: r.home_score,
            awayScore: r.away_score,
            kickoffUtc: r.kickoff_utc,
            matchday: r.matchday,
            stage: r.stage,
          },
        ]),
      );
    },

    async createTeam(team: NewTeam, sourceId: string): Promise<string> {
      // Slug may already exist (seeded) — reuse it, then map the source.
      const { data: existing } = await db
        .from('teams')
        .select('id')
        .eq('slug', team.slug)
        .maybeSingle();

      let teamId = existing?.id as string | undefined;
      if (!teamId) {
        const { data, error } = await db
          .from('teams')
          .insert({
            slug: team.slug,
            name: team.name,
            short_name: team.shortName,
            country: team.country,
            crest_url: team.crestUrl,
          })
          .select('id')
          .single();
        if (error) throw error;
        teamId = data.id;
      }

      const { error: mapError } = await db.from('team_sources').upsert(
        { canonical_id: teamId, source, source_id: sourceId, source_name: team.name, confidence: 1.0 },
        { onConflict: 'source,source_id' },
      );
      if (mapError) throw mapError;
      return teamId!;
    },

    async upsertMatch(m: MatchUpsert): Promise<string> {
      const { data: existing } = await db
        .from('match_sources')
        .select('canonical_id')
        .eq('source', source)
        .eq('source_id', m.sourceId)
        .maybeSingle();

      const payload = {
        season_id: m.seasonId,
        competition_id: m.competitionId,
        home_team_id: m.homeTeamId,
        away_team_id: m.awayTeamId,
        kickoff_utc: m.kickoffUtc,
        status: m.status,
        minute: m.minute,
        home_score: m.homeScore,
        away_score: m.awayScore,
        matchday: m.matchday,
        stage: m.stage,
      };

      let matchId = existing?.canonical_id as string | undefined;
      if (matchId) {
        const { error } = await db.from('matches').update(payload).eq('id', matchId);
        if (error) throw error;
      } else {
        const { data, error } = await db
          .from('matches')
          .insert(payload)
          .select('id')
          .single();
        if (error) throw error;
        matchId = data.id;
        const { error: mapError } = await db.from('match_sources').upsert(
          { canonical_id: matchId, source, source_id: m.sourceId, confidence: 1.0 },
          { onConflict: 'source,source_id' },
        );
        if (mapError) throw mapError;
      }
      return matchId!;
    },

    async upsertStandings(rows: StandingUpsert[]): Promise<number> {
      if (rows.length === 0) return 0;
      const payload = rows.map((r) => ({
        season_id: r.seasonId,
        team_id: r.teamId,
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
      }));
      const { error } = await db
        .from('standings')
        .upsert(payload, { onConflict: 'season_id,team_id' });
      if (error) throw error;
      return rows.length;
    },
  };
}
