import { parseForm } from '../../lib/helpers';

interface TeamRef {
  slug: string;
  name: string;
  short_name?: string | null;
}

export interface StandingRow {
  position: number;
  played: number;
  won?: number;
  drawn?: number;
  lost?: number;
  gf?: number;
  ga?: number;
  gd: number;
  points: number;
  form?: string | null;
  team: TeamRef;
}

// Cobalt has no Table component — semantic <table> styled with Cobalt tokens.
export default function StandingsTable({
  rows,
  label = 'Standings',
  compact = false,
}: {
  rows: StandingRow[];
  label?: string;
  compact?: boolean;
}) {
  return (
    <table className="standings-table" aria-label={label}>
      <thead>
        <tr>
          <th scope="col" aria-label="Position">#</th>
          <th scope="col" className="team-col">Team</th>
          <th scope="col" title="Played">P</th>
          {!compact && (
            <>
              <th scope="col" title="Won">W</th>
              <th scope="col" title="Drawn">D</th>
              <th scope="col" title="Lost">L</th>
              <th scope="col" title="Goals for">GF</th>
              <th scope="col" title="Goals against">GA</th>
            </>
          )}
          <th scope="col" title="Goal difference">GD</th>
          <th scope="col" title="Points">Pts</th>
          {!compact && <th scope="col">Form</th>}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.team.slug}>
            <td className="pos">{r.position}</td>
            <td className="team-col">
              <a href={`/teams/${r.team.slug}`}>{r.team.name}</a>
            </td>
            <td>{r.played}</td>
            {!compact && (
              <>
                <td>{r.won}</td>
                <td>{r.drawn}</td>
                <td>{r.lost}</td>
                <td>{r.gf}</td>
                <td>{r.ga}</td>
              </>
            )}
            <td>{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
            <td className="pts">{r.points}</td>
            {!compact && (
              <td>
                <span className="form-badges" aria-label={`Form: ${r.form ?? 'unknown'}`}>
                  {parseForm(r.form ?? null).map((f, i) => (
                    <span key={i} className={`form-badge form-${f.toLowerCase()}`}>
                      {f}
                    </span>
                  ))}
                </span>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
