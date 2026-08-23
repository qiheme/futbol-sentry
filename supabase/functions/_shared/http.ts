// HTTP helpers for upstream API calls. No Deno APIs and no supabase-js import,
// so parseRetryAfterMs is unit-testable under Node.

const DEFAULT_RETRY_MS = 10_000;
const MIN_RETRY_MS = 1_000;
const MAX_RETRY_MS = 120_000;

// Retry-After is either delta-seconds or an HTTP-date (RFC 9110 §10.2.3).
export function parseRetryAfterMs(value: string | null, nowMs: number): number {
  let ms = DEFAULT_RETRY_MS;
  if (value) {
    if (/^\d+$/.test(value.trim())) {
      ms = Number(value.trim()) * 1000;
    } else {
      const date = Date.parse(value);
      if (!Number.isNaN(date)) ms = date - nowMs;
    }
  }
  return Math.min(Math.max(ms, MIN_RETRY_MS), MAX_RETRY_MS);
}

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// JSON fetcher with football-data auth + 429 back-off.
export async function fetchJson(url: string, apiKey: string): Promise<unknown> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { headers: { 'X-Auth-Token': apiKey } });
    if (res.status === 429) {
      await sleep(parseRetryAfterMs(res.headers.get('Retry-After'), Date.now()));
      continue;
    }
    if (!res.ok) {
      throw new Error(`football-data ${res.status} for ${url}`);
    }
    return await res.json();
  }
  throw new Error(`football-data rate-limited after retries for ${url}`);
}
