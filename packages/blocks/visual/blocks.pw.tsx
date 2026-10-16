import { mkdir, readFile } from 'node:fs/promises';
import { renderToStaticMarkup } from 'react-dom/server';
import { test, expect } from '@playwright/test';
import { registry } from '../src/registry';
import { renderPage } from '../src/render-page';
import { createTheme, themeToCssVars } from '../src/theme';

const theme = createTheme();
const assetId = 'b8dca0a7-2612-4078-80a0-c692c3d76d90';
const image = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#176039"/></svg>');
const style = Object.entries(themeToCssVars(theme))
  .map(([key, value]) => `${key}:${value}`)
  .join(';');
const css = await readFile(new URL('../src/blocks.css', import.meta.url), 'utf8');
const product = { id: assetId, store_id: assetId, name: 'Mesa artesanal de madera', slug: 'mesa-artesanal',
  is_featured: true, category_id: null, currency: 'ARS', image: { product_id: assetId, store_id: assetId,
    asset_id: assetId, alt_text: 'Mesa artesanal', position: 0 },
  variant: { id: assetId, store_id: assetId, product_id: assetId, price_amount: 1550000,
    compare_at_amount: 1700000, is_available: false, is_default: true } };
function previewData(type: string) {
  if (type === 'featured-products' || type === 'product-grid')
    return { items: Array.from({ length: 4 }, (_, index) => ({ ...product, id: `${assetId}-${index}` })), outOfStockLabel: 'Sin stock' };
  if (type === 'category-grid') return Array.from({ length: 4 }, (_, index) =>
    ({ id: `${assetId}-${index}`, store_id: assetId, name: 'Muebles del hogar', slug: 'muebles', image_asset_id: assetId }));
  return [];
}

for (const definition of registry) {
  for (const variant of definition.variants) {
    test(`${definition.type} ${variant.id} fits at 360px`, async ({ page }) => {
      const props =
        definition.type === 'hero'
          ? { title: 'Todo para tu mascota', subtitle: 'Envíos en el día', image: { assetId, alt: 'Imagen de ejemplo' },
              cta: { label: 'Ver productos', link: { kind: 'collection', categoryId: null } } }
          : definition.type === 'rich-text'
            ? { title: 'Nuestra historia', body: 'Hecho con cuidado para tu familia.' }
            : {};
      const blocks = await renderPage(
        [{ id: 'one', type: definition.type, version: 1, variant: variant.id, props }],
        { storeId: 'store', locale: 'es-419', assetUrl: () => image },
        theme,
        { resolveDefinition: (type) => type === definition.type ? { ...definition,
          loader: async () => previewData(type),
        } : undefined },
      );
      await page.setContent(
        `<html><style>${css}</style><body style="margin:0"><main class="store-layout" style="${style}">${renderToStaticMarkup(blocks)}</main></body></html>`,
      );
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
      if (process.env.CAPTURE_BLOCKS === '1' && definition.type === 'hero' && variant.id === 'split') {
        await mkdir(new URL('./screenshots', import.meta.url), { recursive: true });
        await page.screenshot({ path: 'visual/screenshots/hero-mobile.png', fullPage: true });
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.screenshot({ path: 'visual/screenshots/hero-desktop.png', fullPage: true });
      }
      if (process.env.CAPTURE_BLOCKS === '1' && definition.type === 'product-grid' && variant.id === 'grid-2') {
        await mkdir(new URL('./screenshots', import.meta.url), { recursive: true });
        await page.screenshot({ path: 'visual/screenshots/products-mobile.png', fullPage: true });
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.screenshot({ path: 'visual/screenshots/products-desktop.png', fullPage: true });
      }
    });
  }
}
