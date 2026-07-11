import { describe, expect, it } from 'vitest';

// Scaffold sanity: the test runner executes and TS + ESM resolution work.
describe('scaffold', () => {
  it('runs vitest with TS + ESM', () => {
    const leagues = ['PL', 'PD', 'BL1', 'SA', 'FL1'];
    expect(leagues).toHaveLength(5);
  });
});
