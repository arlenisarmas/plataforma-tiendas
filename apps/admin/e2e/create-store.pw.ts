import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 360, height: 800 } });
test('create a store in four steps', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill('arle@ejemplo.com');
  await page.getByLabel('Contraseña').fill('demo1234');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await page.goto('/stores/new');
  await page.getByLabel('Nombre del negocio').fill(`Tienda ${Date.now()}`);
  await expect(page.getByText('Esta dirección está disponible.')).toBeVisible();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByRole('button', { name: 'Crear mi tienda' }).click();
  await expect(page.getByRole('heading', { name: 'Inicio' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Tu tienda al 100%' })).toBeVisible();
});
