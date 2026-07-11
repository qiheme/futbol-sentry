import { expect, test } from '@playwright/test';

// App shell: dark Cobalt theme, top navigation, football-data.org attribution.
test.describe('app shell', () => {
  test('applies the dark Cobalt theme on <html>', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('has top navigation with primary links', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation');
    await expect(nav).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Home', exact: true })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Competitions', exact: true })).toBeVisible();
  });

  test('shows the required football-data.org attribution in the footer', async ({ page }) => {
    await page.goto('/');
    const footer = page.getByRole('contentinfo');
    await expect(footer).toContainText(
      'Football data provided by the Football-Data.org API',
    );
  });

  test('loads Cobalt styles (dark background tokens active)', async ({ page }) => {
    await page.goto('/');
    const bg = await page.evaluate(
      () => getComputedStyle(document.body).backgroundColor,
    );
    // Cobalt dark theme must not leave the default white body.
    expect(bg).not.toBe('rgba(0, 0, 0, 0)');
    expect(bg).not.toBe('rgb(255, 255, 255)');
  });
});
