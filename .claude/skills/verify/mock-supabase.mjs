// Minimal PostgREST-shaped stub. Evaluates eq/gte/lt/or filters for real so the
// app's own query predicates decide which rows come back. Logs every request URL.
import { createServer } from 'node:http';
import { appendFileSync } from 'node:fs';

const LOG = process.env.MOCK_LOG || '/tmp/mock-requests.log';
const PORT = Number(process.env.MOCK_PORT || 54321);

// --- data -------------------------------------------------------------
const comp = { id: 'c1', slug: 'premier-league', name: 'Premier League', type: 'league', country: 'England', confederation: 'UEFA', tier: 1 };
const arsenal = { id: 't1', slug: 'arsenal', name: 'Arsenal FC', short_name: 'Arsenal', country: 'England', crest_url: null };
const chelsea = { id: 't2', slug: 'chelsea', name: 'Chelsea FC', short_name: 'Chelsea', country: 'England', crest_url: null };

// Local-time anchors: the whole point of the fix is LOCAL calendar day.
const midnight = new Date(); midnight.setHours(0, 0, 0, 0);
const at = (dayOffset, h, m = 0) => {
  const d = new Date(midnight); d.setDate(d.getDate() + dayOffset); d.setHours(h, m, 0, 0); return d.toISOString();
};

const mk = (id, status, kickoff, hs, as_, minute) => ({
  id, status, minute, home_score: hs, away_score: as_, kickoff_utc: kickoff,
  matchday: 22, stage: 'REGULAR_SEASON', season_id: 's1', home_team_id: 't1', away_team_id: 't2',
  competition: { slug: comp.slug, name: comp.name },
  home_team: { slug: arsenal.slug, name: arsenal.name, short_name: arsenal.short_name, crest_url: null },
  away_team: { slug: chelsea.slug, name: chelsea.name, short_name: chelsea.short_name, crest_url: null },
  season: { id: 's1', year_label: '2025-26' }, venue: null,
});

// SPILLOVER: live match that kicked off 22:30 YESTERDAY local (outside today's window)
const liveSpillover = mk('m-live-spillover', 'live', at(-1, 22, 30), 1, 1, 71);
// In today's local window
const todayScheduled = mk('m-today', 'scheduled', at(0, 19, 0), null, null, null);
// Yesterday, finished — must NOT appear (proves the window still excludes)
const yesterdayFinished = mk('m-yesterday', 'finished', at(-1, 15, 0), 2, 0, null);

const DB = {
  competitions: [comp],
  teams: [arsenal, chelsea],
  seasons: [{ id: 's1', year_label: '2025-26', start_date: '2025-08-08', end_date: '2026-05-24', is_current: true, competition_id: 'c1', competition: { id: comp.id, slug: comp.slug, name: comp.name, country: comp.country } }],
  matches: [liveSpillover, todayScheduled, yesterdayFinished],
  standings: [{ position: 1, played: 21, won: 15, drawn: 4, lost: 2, gf: 48, ga: 18, gd: 30, points: 49, form: 'WWDWW', season_id: 's1', team_id: 't1', team: { slug: arsenal.slug, name: arsenal.name, short_name: arsenal.short_name, crest_url: null }, season: { year_label: '2025-26', is_current: true, competition: { slug: comp.slug, name: comp.name } } }],
  match_events: [{ id: 'e1', minute: 23, type: 'goal', detail: 'Goal — Saka', match_id: 'm-live-spillover', team: { slug: arsenal.slug, short_name: arsenal.short_name, name: arsenal.name } }],
  venues: [],
};

// --- filter engine ----------------------------------------------------
function splitTop(s) { // split on commas not inside parens
  const out = []; let depth = 0, cur = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}
function cmp(row, col, op, val) {
  const v = row[col];
  if (op === 'eq') return String(v) === val || (val === 'true' && v === true) || (val === 'false' && v === false);
  if (op === 'gte') return new Date(v) >= new Date(val);
  if (op === 'lt') return new Date(v) < new Date(val);
  if (op === 'lte') return new Date(v) <= new Date(val);
  if (op === 'gt') return new Date(v) > new Date(val);
  throw new Error('unsupported op ' + op);
}
function evalExpr(row, expr) {
  expr = expr.trim();
  if (expr.startsWith('and(')) return splitTop(expr.slice(4, -1)).every((e) => evalExpr(row, e));
  if (expr.startsWith('or(')) return splitTop(expr.slice(3, -1)).some((e) => evalExpr(row, e));
  const [col, op, ...rest] = expr.split('.');
  return cmp(row, col, op, rest.join('.'));
}

createServer((req, res) => {
  const u = new URL(req.url, 'http://localhost');
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*', 'Access-Control-Expose-Headers': '*' };
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); res.end(); return; }
  appendFileSync(LOG, decodeURIComponent(u.pathname + u.search) + '\n');
  const table = u.pathname.replace('/rest/v1/', '');
  let rows = [...(DB[table] || [])];

  for (const [k, raw] of u.searchParams.entries()) {
    if (['select', 'order', 'limit', 'offset', 'apikey'].includes(k)) continue;
    if (k === 'or') { rows = rows.filter((r) => evalExpr(r, 'or' + raw)); continue; }
    const [op, ...rest] = raw.split('.');
    rows = rows.filter((r) => cmp(r, k, op, rest.join('.')));
  }
  const order = u.searchParams.get('order');
  if (order) {
    const [col, dir] = order.split('.');
    rows.sort((a, b) => (a[col] > b[col] ? 1 : a[col] < b[col] ? -1 : 0) * (dir === 'desc' ? -1 : 1));
  }
  const accept = req.headers.accept || '';
  const body = accept.includes('vnd.pgrst.object') ? (rows[0] ?? null) : rows;
  res.writeHead(200, { 'Content-Type': 'application/json', ...cors });
  res.end(JSON.stringify(body));
}).listen(PORT, () => console.log('mock supabase on ' + PORT));
