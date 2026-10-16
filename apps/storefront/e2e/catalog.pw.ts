import { expect, test } from '@playwright/test';

test('category, search and out-of-stock options work on a 360px store', async ({ page }) => {
  await page.goto('http://chepeludos.localhost:3000/categoria/perros');
  await expect(page.getByRole('heading', { name: 'Perros' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Buzo polar para perro/ })).toBeVisible();
  await page.goto('http://chepeludos.localhost:3000/buscar?q=buzo');
  await expect(page.getByRole('link', { name: /Buzo polar para perro/ })).toBeVisible();
  await page.goto('http://chepeludos.localhost:3000/producto/buzo-polar-perro');
  await expect(page.getByRole('radio', { name: /Talle L.*Sin stock/ })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Agregar al carrito' })).toBeEnabled();
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 360);
});
