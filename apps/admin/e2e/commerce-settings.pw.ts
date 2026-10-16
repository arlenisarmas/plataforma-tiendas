import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 360, height: 800 } });
test('configure pickup and bank transfer in under two minutes', async ({ page }) => {
  const started = Date.now();
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill('arle@ejemplo.com');
  await page.getByLabel('Contraseña').fill('demo1234');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await page.goto('/settings');
  const shipping = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Cómo entregás' }) });
  await shipping.locator('form').last().getByRole('button', { name: 'Guardar' }).click();
  await expect(shipping.locator('form').last().getByRole('status')).toHaveText('Guardado');
  const payment = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Cómo te pagan' }) });
  await payment.getByLabel('Titular').fill('Tienda de prueba');
  await payment.getByLabel('Banco').fill('Banco de prueba');
  await payment.getByLabel('Alias o CBU').fill('tienda.demo');
  await payment.getByRole('button', { name: 'Guardar' }).click();
  await expect(payment.getByRole('status')).toHaveText('Guardado');
  expect(Date.now() - started).toBeLessThan(2 * 60 * 1000);
});
