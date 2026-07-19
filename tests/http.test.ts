import { describe, expect, it } from 'vitest';
import { parseRetryAfterMs } from '../supabase/functions/_shared/http';

describe('parseRetryAfterMs', () => {
  it('parses delta-seconds', () => {
    expect(parseRetryAfterMs('30', 0)).toBe(30_000);
  });

  it('parses an HTTP-date relative to now', () => {
    const now = Date.parse('2026-07-15T10:00:00Z');
    expect(parseRetryAfterMs('Wed, 15 Jul 2026 10:00:30 GMT', now)).toBe(30_000);
  });

  it('falls back to the default for missing or garbage values', () => {
    expect(parseRetryAfterMs(null, 0)).toBe(10_000);
    expect(parseRetryAfterMs('soon', 0)).toBe(10_000);
  });

  it('clamps to sane bounds (never NaN, never negative, capped)', () => {
    const now = Date.parse('2026-07-15T10:00:00Z');
    // HTTP-date in the past → minimum wait, not negative/zero hammering.
    expect(parseRetryAfterMs('Wed, 15 Jul 2026 09:00:00 GMT', now)).toBe(1_000);
    expect(parseRetryAfterMs('0', 0)).toBe(1_000);
    expect(parseRetryAfterMs('9999', 0)).toBe(120_000);
    expect(Number.isNaN(parseRetryAfterMs('NaN', 0))).toBe(false);
  });
});
