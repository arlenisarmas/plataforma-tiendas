import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 360, height: 800 } });
test('change hero photo and title within one minute, then switch design without losing content', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill('arle@ejemplo.com');
  await page.getByLabel('Contraseña').fill('demo1234');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await page.goto('/page/edit');
  const started = Date.now();
  await page.getByRole('button', { name: 'Portada' }).first().click();
  const title = `Portada ${Date.now()}`;
  await page.getByLabel('Título', { exact: true }).fill(title);
  await page.getByLabel('Subir imagen').setInputFiles({ name: 'portada.png', mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a+t8AAAAASUVORK5CYII=', 'base64') });
  await page.getByRole('button', { name: 'Subir imagen' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Imagen elegida.' })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Guardado' })).toBeVisible();
  expect(Date.now() - started).toBeLessThan(60_000);
  await page.getByRole('button', { name: 'Cambiar diseño' }).click();
  await page.getByRole('button', { name: 'Solo texto' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Guardado' })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Portada' }).first().click();
  await expect(page.getByLabel('Título', { exact: true })).toHaveValue(title);
  await page.getByRole('button', { name: 'Cambiar diseño' }).click();
  await expect(page.getByRole('button', { name: 'Solo texto' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('status').filter({ hasText: 'Imagen elegida.' })).toBeVisible();
});
