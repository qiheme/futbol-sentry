import Heading from '@q-labs/cobalt/Heading';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import { useState } from 'react';
import { groupByCompetition } from '../../lib/helpers';
import { todayFixtures } from '../../lib/queries';
import MatchCard, { type MatchCardMatch } from './MatchCard';

// Refetch every minute so scores stay fresh without a rebuild. Phase 3 swaps
// polling for a Supabase Realtime subscription in this same island.
function Fixtures() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['today-fixtures'],
    queryFn: todayFixtures,
    refetchInterval: 60_000,
  });

  if (isPending) return <p className="muted">Loading today’s fixtures…</p>;
  if (isError) return <p className="muted">Could not load fixtures.</p>;
  if (data.length === 0) return <p className="muted">No fixtures today.</p>;

  const groups = groupByCompetition(data as unknown as (MatchCardMatch & {
    competition: { slug: string; name: string };
  })[]);

  return (
    <>
      {groups.map((group) => (
        <section key={group.competition.slug} className="fixture-group">
          <Heading level={2}>{group.competition.name}</Heading>
          <div className="match-card-list">
            {group.matches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

export default function TodayFixtures() {
  const [client] = useState(() => new QueryClient());
  return (
    <div data-testid="today-fixtures">
      <QueryClientProvider client={client}>
        <Fixtures />
      </QueryClientProvider>
    </div>
  );
}
