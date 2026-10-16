import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type TestInfo } from '@playwright/test';

// Valid 1x1 PNG (the browser must be able to decode it to compress it).
const photo = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

// Next.js renders an empty role="alert" route announcer; only alerts with text are errors.
const errorAlert = (page: Page) => page.getByRole('alert').filter({ hasText: /\S/ });

async function audit(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) }))).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

async function timed(name: string, budget: number, info: TestInfo, action: () => Promise<void>) {
  const start = Date.now();
  await test.step(name, action);
  const elapsed = Date.now() - start;
  await info.attach(`${name.replaceAll(' ', '-')}-duration.json`, {
    body: JSON.stringify({ elapsedMs: elapsed, budgetMs: budget }), contentType: 'application/json',
  });
  expect(elapsed, `${name} debe completar en ${budget / 1000} segundos`).toBeLessThan(budget);
}

test('six critical journeys work on mobile and desktop', async ({ page }, info) => {
  test.setTimeout(15 * 60_000);
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').first().fill('arle@ejemplo.com');
  await page.getByLabel('Contraseña').fill('demo1234');
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
  // Arle administra la plataforma: entra a la consola (T-034).
  await expect(page).toHaveURL(/localhost:3001\/platform$/);
  await expect(page.getByRole('heading', { name: /Hola, / })).toBeVisible();
  await audit(page);

  const storeStart = Date.now();
  const storeName = `Tienda E2E ${Date.now()}`;
  let storeId = '';
  let storeSlug = '';
  await test.step('Crear una tienda desde cero', async () => {
    await page.goto('/stores/new');
    await page.getByLabel('Nombre del negocio').fill(storeName);
    await expect(page.getByText('Esta dirección está disponible.')).toBeVisible();
    storeSlug = await page.getByLabel('Dirección de tu tienda').inputValue();
    for (let step = 0; step < 3; step++) await page.getByRole('button', { name: 'Siguiente' }).click();
    await page.getByRole('button', { name: 'Crear mi tienda' }).click();
    // Al crear la tienda se entra directo al armado guiado (T-038).
    await expect(page.getByRole('heading', { name: 'Tu portada' })).toBeVisible({ timeout: 20_000 });
    storeId = new URL(page.url()).searchParams.get('store') ?? '';
    expect(storeId).toMatch(/^[0-9a-f-]{36}$/i);
    await audit(page);
  });

  await timed('Cargar producto con foto precio y stock', 3 * 60_000, info, async () => {
    await page.goto(`/products/new?store=${storeId}`);
    await page.getByLabel('Nombre', { exact: true }).fill(`Producto ${Date.now()}`);
    await page.getByLabel('Precio', { exact: true }).fill('15.000,50');
    await page.getByLabel('Unidades disponibles').fill('5');
    await page.getByLabel('Subir imagen').setInputFiles({ name: 'foto.png', mimeType: 'image/png', buffer: photo });
    await page.locator('button', { hasText: 'Subir imagen' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Imagen elegida.' }).or(errorAlert(page)))
      .toBeVisible({ timeout: 30_000 });
    await expect(errorAlert(page)).toHaveCount(0);
    await page.getByRole('button', { name: 'Guardar y publicar' }).click();
    await expect(page.getByText('Producto guardado.')).toBeVisible();
    await audit(page);
  });

  await timed('Cambiar foto y título de portada', 60_000, info, async () => {
    await page.goto(`/page/edit?store=${storeId}`);
    await page.getByRole('button', { name: 'Portada' }).first().click();
    await page.getByLabel('Título', { exact: true }).fill('Portada de prueba');
    await page.getByLabel('Subir imagen').setInputFiles({ name: 'portada.png', mimeType: 'image/png', buffer: photo });
    await page.locator('button', { hasText: 'Subir imagen' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Guardado' }).or(errorAlert(page)))
      .toBeVisible({ timeout: 30_000 });
    await expect(errorAlert(page)).toHaveCount(0);
    await page.getByRole('button', { name: 'Publicar', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Tus cambios ya están en tu tienda' })).toBeVisible();
    await audit(page);
  });

  await test.step('Publicar y abrir la tienda', async () => {
    await page.goto(`/settings?store=${storeId}`);
    const shipping = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Cómo entregás' }) });
    await shipping.locator('form').last().getByRole('button', { name: 'Guardar' }).click();
    await expect(shipping.locator('form').last().getByRole('status')).toHaveText('Guardado', { timeout: 15_000 });
    const payment = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Cómo te pagan' }) });
    await payment.getByLabel('Titular').fill('Tienda de prueba');
    await payment.getByLabel('Banco').fill('Banco de prueba');
    await payment.getByLabel(/Alias o (CBU|número de cuenta)/).fill('tienda.demo');
    await payment.getByRole('button', { name: 'Guardar' }).click();
    await expect(payment.getByRole('status')).toHaveText('Guardado', { timeout: 15_000 });
    await page.goto(`/publish?store=${storeId}`);
    await page.getByRole('button', { name: /Publicar|Abrir mi tienda/ }).click();
    await expect(page.getByRole('status')).toContainText('disponible');
    await page.goto(`http://${storeSlug}.localhost:3000/`);
    await expect(page.getByText('Portada de prueba')).toBeVisible();
    await audit(page);
  });
  expect(Date.now() - storeStart, 'Crear y publicar la tienda debe llevar menos de 10 minutos').toBeLessThan(10 * 60_000);

  let orderId = '';
  await timed('Comprar como cliente desde celular o escritorio', 2 * 60_000, info, async () => {
    await page.goto('http://chepeludos.localhost:3000/producto/collar-reflectivo');
    await page.getByRole('button', { name: 'Agregar al carrito' }).click();
    await expect(page.getByRole('button', { name: 'Agregado al carrito' }).or(errorAlert(page)))
      .toBeVisible({ timeout: 20_000 });
    await expect(errorAlert(page)).toHaveCount(0);
    await page.goto('http://chepeludos.localhost:3000/carrito');
    await page.getByRole('link', { name: 'Finalizar compra' }).click();
    await page.getByLabel('Nombre completo').fill('Compradora de prueba');
    const email = `compra-${Date.now()}@example.test`;
    await page.getByLabel('Correo electrónico').fill(email);
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByRole('radio', { name: /Retiro/ }).check();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByRole('radio', { name: /Transferencia/ }).check();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByRole('button', { name: 'Confirmar compra' }).click();
    await expect(page.getByRole('heading', { name: /Tu pedido/ })).toBeVisible();
    orderId = new URL(page.url()).pathname.split('/').pop() ?? '';
    expect(orderId).toMatch(/^[0-9a-f-]{36}$/i);
    await audit(page);
  });

  await timed('Confirmar pago por transferencia', 60_000, info, async () => {
    await page.goto('/orders');
    await page.getByRole('link', { name: /#[0-9]+/ }).first().click();
    await expect(page).toHaveURL(new RegExp(`/orders/${orderId}`));
    await page.getByRole('button', { name: 'Confirmar pago' }).click();
    // The purchase uses pickup, so the next step is "ready for pickup" (shipping is not offered).
    await expect(page.getByRole('button', { name: 'Marcar listo para retirar' })).toBeVisible();
    await audit(page);
  });

  await timed('Ver pedido y marcarlo como enviado', 60_000, info, async () => {
    await page.goto('/orders');
    await page.getByRole('link', { name: /#[0-9]+/ }).first().click();
    await expect(page).toHaveURL(new RegExp(`/orders/${orderId}`));
    await page.getByRole('button', { name: 'Marcar listo para retirar' }).click();
    // The detail header shows "<status> · <email>".
    await expect(page.getByText(/^Listo para retirar ·/)).toBeVisible({ timeout: 15_000 });
    await audit(page);
  });
});

test('the admin invites a person who sets a password and lands in My space', async ({ page }) => {
  test.setTimeout(5 * 60_000);
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').first().fill('arle@ejemplo.com');
  await page.getByLabel('Contraseña').fill('demo1234');
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
  await expect(page).toHaveURL(/\/platform$/);

  const email = `invitada-${Date.now()}-${test.info().project.name}@example.test`;
  let link = '';
  await test.step('Invitar a una persona que tendrá su propia tienda', async () => {
    await page.goto('/platform/invite');
    await page.getByLabel('Nombre', { exact: true }).fill('Sofía');
    await page.getByLabel('Correo electrónico').fill(email);
    await page.getByRole('button', { name: 'Enviar invitación' }).click();
    const status = page.getByRole('status').filter({ hasText: 'Invitación enviada' });
    await expect(status).toBeVisible({ timeout: 20_000 });
    link = await status.getByRole('textbox').inputValue();
    expect(link).toMatch(/\/join\/[A-Za-z0-9_-]{32,}$/);
    await audit(page);
  });

  await test.step('La persona crea su contraseña y entra a Mi espacio', async () => {
    await page.context().clearCookies();
    await page.goto(new URL(link).pathname);
    await expect(page.getByRole('heading', { name: 'Te invitaron' })).toBeVisible();
    await audit(page);
    await page.getByLabel('Elige una contraseña').fill('clave-segura-123');
    await page.getByRole('button', { name: 'Crear mi acceso' }).click();
    await expect(page.getByRole('heading', { name: 'Hola, Sofía' })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('link', { name: /Nuevo proyecto/ })).toBeVisible();
    await audit(page);
  });

  await test.step('Una persona sin permiso no ve la consola y el registro abierto está cerrado', async () => {
    await page.goto('/platform');
    await expect(page.getByRole('alert').filter({ hasText: /\S/ })).toContainText('No tienes permiso');
    await page.context().clearCookies();
    await page.goto('/signup');
    await expect(page.getByRole('status')).toContainText('solo por invitación');
  });
});
