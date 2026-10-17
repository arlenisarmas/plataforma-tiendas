import { randomBytes } from 'node:crypto';
import sharp from 'sharp';
import { expect, test } from '@playwright/test';

test('a large phone photo is compressed before upload', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').first().fill('arle@ejemplo.com');
  await page.getByLabel('Contraseña').fill('demo1234');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await page.goto('/page/media');

  const pixels = randomBytes(3000 * 2500 * 3);
  const photo = await sharp(pixels, { raw: { width: 3000, height: 2500, channels: 3 } }).jpeg({ quality: 95 }).toBuffer();
  expect(photo.length).toBeGreaterThan(6 * 1024 * 1024);
  expect(photo.length).toBeLessThan(10 * 1024 * 1024);
  await page.getByLabel('Subir imagen').setInputFiles({ name: 'foto-celular.jpg', mimeType: 'image/jpeg', buffer: photo });
  await page.getByRole('button', { name: 'Subir imagen' }).click();
  await expect(page.getByRole('status')).toContainText('Imagen elegida');
  const sizeLabel = await page.locator('button[aria-pressed="true"] span').textContent();
  expect(Number(sizeLabel?.replace(' KB', ''))).toBeLessThan(500);
});

test('an oversized upload explains how to recover', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').first().fill('arle@ejemplo.com');
  await page.getByLabel('Contraseña').fill('demo1234');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await page.goto('/page/media');
  await page.getByLabel('Subir imagen').setInputFiles({ name: 'huge.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(10 * 1024 * 1024 + 1) });
  await page.getByRole('button', { name: 'Subir imagen' }).click();
  await expect(page.getByRole('alert')).toContainText('hasta 10 MB');
});
