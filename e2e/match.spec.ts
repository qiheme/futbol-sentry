import { expect, test } from '@playwright/test';

// Match ids are uuids from the seed — reach a match page by navigating from
// the competition page's Results tab.
async function openFirstResult(page: import('@playwright/test').Page) {
  await page.goto('/competitions/premier-league');
  await page.getByRole('tab', { name: 'Results' }).click();
  await page.getByRole('tabpanel').getByTestId('match-card').first().click();
  await page.waitForURL(/\/matches\//);
}

test.describe('match page', () => {
  test('shows the scoreline and status', async ({ page }) => {
    await openFirstResult(page);
    await expect(page.getByTestId('match-score')).toBeVisible();
    await expect(page.getByText('FT').first()).toBeVisible();
  });

  test('shows the event timeline with goals', async ({ page }) => {
    await openFirstResult(page);
    const timeline = page.getByTestId('match-timeline');
    await expect(timeline).toBeVisible();
    await expect(timeline.getByText(/Goal/).first()).toBeVisible();
  });

  test('shows standings context for the competition', async ({ page }) => {
    await openFirstResult(page);
    await expect(page.getByRole('table', { name: /standings/i })).toBeVisible();
  });

  test('embeds SportsEvent JSON-LD', async ({ page }) => {
    await openFirstResult(page);
    const jsonLd = await page
      .locator('script[type="application/ld+json"]')
      .first()
      .textContent();
    expect(jsonLd).toBeTruthy();
    const parsed = JSON.parse(jsonLd ?? '{}');
    expect(parsed['@type']).toBe('SportsEvent');
    expect(parsed.homeTeam?.name ?? parsed.competitor?.[0]?.name).toBeTruthy();
  });
});
