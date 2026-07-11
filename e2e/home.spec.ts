import { expect, test } from '@playwright/test';

test.describe('home page', () => {
  test("renders today's fixtures grouped by competition (live island)", async ({ page }) => {
    await page.goto('/');
    const today = page.getByTestId('today-fixtures');
    await expect(today).toBeVisible();
    // Seeded data always has matches "today" (kickoffs are relative to now()).
    await expect(today.getByTestId('match-card').first()).toBeVisible({ timeout: 15_000 });
    await expect(today.getByRole('heading', { name: 'Premier League' })).toBeVisible();
  });

  test('shows a live match with an animated status and minute', async ({ page }) => {
    await page.goto('/');
    const live = page.getByTestId('match-card').filter({ hasText: 'LIVE' }).first();
    await expect(live).toBeVisible({ timeout: 15_000 });
    await expect(live.getByText(/\d+'/)).toBeVisible();
  });

  test('features competitions with links to their pages', async ({ page }) => {
    await page.goto('/');
    const featured = page.getByTestId('featured-competitions');
    await expect(featured.getByRole('link', { name: /Premier League/ })).toBeVisible();
    await expect(featured.getByRole('link', { name: /La Liga/ })).toBeVisible();
  });
});
