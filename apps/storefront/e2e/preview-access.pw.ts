import { expect, test } from '@playwright/test';

test('draft preview cannot be opened without a valid short-lived token', async ({ page }) => {
  const response = await page.goto('/preview/not-a-valid-token');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
});
