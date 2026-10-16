import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 360, height: 800 } });
test('add a product with photo, localized price and stock', async ({ page }) => {
  const started = Date.now();
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill('arle@ejemplo.com');
  await page.getByLabel('Contraseña').fill('demo1234');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await page.goto('/products/new');
  await page.getByLabel('Nombre', { exact: true }).fill(`Producto ${Date.now()}`);
  await page.getByLabel('Precio', { exact: true }).fill('15.000,50');
  await page.getByLabel('Unidades disponibles').fill('5');
  await page.getByLabel('Subir imagen').setInputFiles({ name: 'foto.png', mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a+t8AAAAASUVORK5CYII=', 'base64') });
  await page.getByRole('button', { name: 'Subir imagen' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Imagen elegida.' })).toBeVisible();
  await page.getByRole('button', { name: 'Guardar y publicar' }).click();
  await expect(page.getByText('Producto guardado.')).toBeVisible();
  expect(Date.now() - started).toBeLessThan(3 * 60 * 1000);
});
