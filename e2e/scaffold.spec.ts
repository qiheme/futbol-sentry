import { expect, test } from '@playwright/test';

// Scaffold sanity: dev server boots and serves the placeholder page.
test('dev server responds', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
});
