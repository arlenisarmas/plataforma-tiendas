import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 360, height: 800 } });

test('seller sees a new order and marks it shipped within a minute', async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto('http://chepeludos.localhost:3000/producto/buzo-polar-perro');
  await page.getByRole('button', { name: 'Agregar al carrito' }).click();
  await page.goto('http://chepeludos.localhost:3000/carrito');
  await page.getByRole('link', { name: 'Finalizar compra' }).click();
  const buyerEmail = `pedido-${Date.now()}@example.test`;
  await page.getByLabel('Nombre completo').fill('Compradora de prueba');
  await page.getByLabel('Correo electrónico').fill(buyerEmail);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('radio', { name: /Envío a domicilio/ }).check();
  await page.getByLabel('Dirección').fill('Calle de prueba 123');
  await page.getByLabel('Ciudad').fill('Buenos Aires');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('radio', { name: /Transferencia/ }).check();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Confirmar compra' }).click();
  await expect(page.getByRole('heading', { name: /Tu pedido/ })).toBeVisible();
  const orderId = new URL(page.url()).pathname.split('/').pop();
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill('arle@ejemplo.com');
  await page.getByLabel('Contraseña').fill('demo1234');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  const started = Date.now();
  await page.goto('/orders');
  await page.getByRole('link', { name: /#[0-9]+/ }).filter({ hasText: buyerEmail }).first().click();
  await expect(page).toHaveURL(new RegExp(`/orders/${orderId}`));
  await page.getByRole('button', { name: 'Confirmar pago' }).click();
  await expect(page.getByRole('button', { name: 'Marcar como enviado' })).toBeVisible();
  await page.getByRole('button', { name: 'Marcar como enviado' }).click();
  await expect(page.getByText('Enviado', { exact: true })).toBeVisible();
  expect(Date.now() - started).toBeLessThan(60_000);
});
