import { expect, test } from '@playwright/test';

test.describe('competitions index', () => {
  test('lists competitions with links', async ({ page }) => {
    await page.goto('/competitions');
    await expect(page.getByRole('heading', { level: 1, name: /Competitions/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Premier League/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Bundesliga/ })).toBeVisible();
  });
});

test.describe('competition page', () => {
  test('renders the standings table in position order', async ({ page }) => {
    await page.goto('/competitions/premier-league');
    const table = page.getByRole('table', { name: /standings/i });
    await expect(table).toBeVisible();
    const rows = table.locator('tbody tr');
    await expect(rows).toHaveCount(4);
    await expect(rows.nth(0)).toContainText('Arsenal');
    await expect(rows.nth(0)).toContainText('49');
    await expect(rows.nth(1)).toContainText('Liverpool');
  });

  test('tab strip switches between standings, fixtures and results', async ({ page }) => {
    await page.goto('/competitions/premier-league');
    const tablist = page.getByRole('tablist');
    await expect(tablist).toBeVisible();

    const standingsTab = page.getByRole('tab', { name: 'Standings' });
    const fixturesTab = page.getByRole('tab', { name: 'Fixtures' });
    const resultsTab = page.getByRole('tab', { name: 'Results' });
    await expect(standingsTab).toHaveAttribute('aria-selected', 'true');

    await fixturesTab.click();
    await expect(fixturesTab).toHaveAttribute('aria-selected', 'true');
    const fixturesPanel = page.getByRole('tabpanel');
    await expect(fixturesPanel.getByTestId('match-card').first()).toBeVisible();

    await resultsTab.click();
    await expect(resultsTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel').getByText('FT').first()).toBeVisible();
  });

  test('tab strip supports arrow-key navigation', async ({ page }) => {
    await page.goto('/competitions/premier-league');
    const standingsTab = page.getByRole('tab', { name: 'Standings' });
    await standingsTab.click();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Fixtures' })).toBeFocused();
  });
});
