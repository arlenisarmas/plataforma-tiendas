import { test, expect } from '@playwright/test';

test('seed account signs in, saves text size and protects the panel after sign-out', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').first().fill('arle@ejemplo.com');
  await page.getByLabel('Contraseña').fill('demo1234');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL('http://127.0.0.1:3001/');
  await page.goto('/profile');
  await page.getByLabel('Tamaño de letra').selectOption('150');
  await page.getByRole('button', { name: 'Guardar perfil' }).click();
  await expect(page.getByRole('status')).toContainText('guardados');
  await expect(page.locator('html')).toHaveCSS('font-size', '24px');
  await page.getByRole('button', { name: 'Salir' }).click();
  await page.goto('/profile');
  await expect(page).toHaveURL(/\/login$/);
});

test('registration, magic link and password reset offer the email handoff', async ({ page }) => {
  const email = `new-${Date.now()}@example.com`;
  await page.goto('/signup');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña').fill('prueba1234');
  await page.getByRole('button', { name: 'Crear mi cuenta' }).click();
  await expect(page.getByRole('status')).toContainText('Revisá tu correo');
  await page.getByLabel('Correo electrónico').last().fill(email);
  await page.getByRole('button', { name: 'Enviarme un enlace para ingresar' }).click();
  await expect(page.getByRole('status')).toContainText('Revisá tu correo');
  await page.goto('/forgot');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByRole('button', { name: 'Enviar enlace' }).click();
  await expect(page.getByRole('status')).toContainText('Revisá tu correo');
});
