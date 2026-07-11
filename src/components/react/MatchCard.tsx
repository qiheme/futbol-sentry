import Badge from '@q-labs/cobalt/Badge';
import Mono from '@q-labs/cobalt/Mono';
import StatusDot from '@q-labs/cobalt/StatusDot';
import { matchStatusLabel } from '../../lib/helpers';

interface TeamRef {
  slug: string;
  name: string;
  short_name: string | null;
}

export interface MatchCardMatch {
  id: string;
  status: string;
  minute: number | null;
  home_score: number | null;
  away_score: number | null;
  kickoff_utc: string;
  home_team: TeamRef;
  away_team: TeamRef;
}

function Score({ match }: { match: MatchCardMatch }) {
  if (match.status === 'scheduled' || match.status === 'postponed') {
    return <Mono variant="sm">vs</Mono>;
  }
  return (
    <Mono variant="md" className="match-card-score">
      {match.home_score ?? 0} – {match.away_score ?? 0}
    </Mono>
  );
}

function Status({ match }: { match: MatchCardMatch }) {
  const label = matchStatusLabel(match);
  switch (label.kind) {
    case 'live':
      return (
        <span className="match-card-status">
          <StatusDot variant="active" animated />
          <Badge variant="active">LIVE</Badge>
          <Mono variant="xs">{label.text}</Mono>
        </span>
      );
    case 'finished':
      return <Badge variant="default">{label.text}</Badge>;
    case 'postponed':
      return <Badge variant="warning">{label.text}</Badge>;
    default:
      return <Mono variant="xs">{label.text} UTC</Mono>;
  }
}

// Statically rendered in .astro pages and re-used inside hydrated islands.
export default function MatchCard({ match }: { match: MatchCardMatch }) {
  return (
    <a className="match-card" data-testid="match-card" href={`/matches/${match.id}`}>
      <span className="match-card-team home">{match.home_team.name}</span>
      <Score match={match} />
      <span className="match-card-team away">{match.away_team.name}</span>
      <Status match={match} />
    </a>
  );
}
