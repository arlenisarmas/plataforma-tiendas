import { expect, test } from '@playwright/test';

test('published seed store renders at 360px', async ({ page }) => {
  await page.goto('/?tienda=chepeludos');
  await expect(page.getByText('Che Peludos').first()).toBeVisible();
  await expect(page.locator('main')).toContainText('Hola');
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 360);
});

test('draft seed store is unavailable', async ({ page }) => {
  const response = await page.goto('/?tienda=carpinteria');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
});
