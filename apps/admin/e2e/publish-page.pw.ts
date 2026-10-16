import { expect, test } from '@playwright/test';

test('preview updates without reloading and publication reaches the storefront quickly', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill('arle@ejemplo.com');
  await page.getByLabel('Contraseña').fill('demo1234');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await page.goto('/page/edit');
  await page.getByRole('button', { name: 'Portada' }).first().click();
  const title = `Portada publicada ${Date.now()}`;
  await page.getByLabel('Título', { exact: true }).fill(title);
  const preview = page.frameLocator('iframe[title="Ver cómo queda"]');
  await expect(preview.getByText(title)).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Guardado' })).toBeVisible();
  const started = Date.now();
  await page.getByRole('button', { name: 'Publicar', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Tus cambios ya están en tu tienda' })).toBeVisible();
  await page.goto('http://chepeludos.localhost:3000/');
  await expect(page.getByText(title)).toBeVisible();
  expect(Date.now() - started).toBeLessThan(5_000);
});
