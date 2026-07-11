import { expect, test } from '@playwright/test';

test.describe('team page', () => {
  test('shows team header with standing summary', async ({ page }) => {
    await page.goto('/teams/arsenal');
    await expect(page.getByRole('heading', { level: 1, name: /Arsenal/ })).toBeVisible();
    // Seeded: Arsenal 1st, 49 points.
    await expect(page.getByTestId('team-standing')).toContainText('1');
    await expect(page.getByTestId('team-standing')).toContainText('49');
  });

  test('shows current form from the standings row', async ({ page }) => {
    await page.goto('/teams/arsenal');
    const form = page.getByTestId('team-form');
    await expect(form).toBeVisible();
    await expect(form).toContainText('W');
  });

  test('lists fixtures and results involving the team', async ({ page }) => {
    await page.goto('/teams/arsenal');
    const results = page.getByTestId('team-results');
    const fixtures = page.getByTestId('team-fixtures');
    await expect(results.getByTestId('match-card').first()).toBeVisible();
    await expect(fixtures.getByTestId('match-card').first()).toBeVisible();
    await expect(results.getByText('FT').first()).toBeVisible();
  });
});
