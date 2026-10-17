import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 360, height: 800 } });

test('guest completes a manual order on a 360px phone within two minutes', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('http://chepeludos.localhost:3000/producto/buzo-polar-perro');
  await page.getByRole('button', { name: 'Agregar al carrito' }).click();
  await expect(page.getByRole('button', { name: 'Agregado al carrito' })).toBeVisible();
  await page.goto('http://chepeludos.localhost:3000/carrito');
  await page.getByRole('link', { name: 'Finalizar compra' }).click();
  await page.getByLabel('Nombre completo').fill('Compradora de prueba');
  await page.getByLabel('Correo electrónico').fill('compradora-e2e@example.test');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('radio', { name: /Retiro/ }).check();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('radio', { name: /Transferencia/ }).check();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Confirmar compra' }).click();
  await expect(page.getByRole('heading', { name: /Tu pedido/ })).toBeVisible();
  await expect(page.getByText('Indicaciones para pagar')).toBeVisible();
  await page.getByLabel('Subir comprobante').setInputFiles({ name: 'receipt.pdf',
    mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF') });
  await page.getByRole('button', { name: 'Enviar comprobante' }).click();
  await expect(page.getByText('Recibimos tu comprobante. Vamos a revisarlo.')).toBeVisible();
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 360);
});
