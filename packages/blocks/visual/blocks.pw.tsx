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
    });
  }
}
