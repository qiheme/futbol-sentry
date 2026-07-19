// Pure presentation helpers shared by pages and islands.

export type FormResult = 'W' | 'D' | 'L';

export interface MatchLike {
  id: string;
  status: string;
  minute: number | null;
  kickoff_utc: string;
  competition: { slug: string; name: string };
}

export type StatusLabel =
  | { kind: 'scheduled'; text: string }
  | { kind: 'live'; text: string }
  | { kind: 'finished'; text: string }
  | { kind: 'postponed'; text: string };

export function formatKickoff(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function matchStatusLabel(match: {
  status: string;
  minute: number | null;
  kickoff_utc: string;
}): StatusLabel {
  switch (match.status) {
    case 'live':
      return { kind: 'live', text: `${match.minute ?? 0}'` };
    case 'finished':
      return { kind: 'finished', text: 'FT' };
    case 'postponed':
      return { kind: 'postponed', text: 'Postponed' };
    default:
      return { kind: 'scheduled', text: formatKickoff(match.kickoff_utc) };
  }
}

export interface CompetitionGroup<M extends MatchLike> {
  competition: MatchLike['competition'];
  matches: M[];
}

// Groups in first-seen order; callers pass rows already sorted by kickoff.
export function groupByCompetition<M extends MatchLike>(
  matches: M[],
): CompetitionGroup<M>[] {
  const groups = new Map<string, CompetitionGroup<M>>();
  for (const m of matches) {
    const existing = groups.get(m.competition.slug);
    if (existing) {
      existing.matches.push(m);
    } else {
      groups.set(m.competition.slug, { competition: m.competition, matches: [m] });
    }
  }
  return [...groups.values()];
}

export function parseForm(form: string | null): FormResult[] {
  if (!form) return [];
  return [...form].filter((c): c is FormResult =>
    c === 'W' || c === 'D' || c === 'L',
  );
}
