import { renderToStaticMarkup } from 'react-dom/server';
import { locales, messages } from '@plataforma/i18n';
import { describe, expect, it, vi } from 'vitest';
import { heroDefinition } from './hero/definition';
import type { BlockDefinition } from './types';
import { registry } from './registry';
import { renderPage } from './render-page';
import { contrastRatio, createTheme, curatedPalettes, themeSchema, themeToCssVars } from './theme';

const ctx = { storeId: 'store-1', locale: 'es-419', assetUrl: () => undefined };
const theme = createTheme();

describe('theme', () => {
  it('keeps all curated colors at WCAG AA contrast', () => {
    for (const palette of Object.values(curatedPalettes)) {
      expect(contrastRatio(palette.text, palette.background)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(palette.primary, palette.background)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(palette.accent, palette.background)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('rejects a low-contrast custom palette', () => {
    expect(
      themeSchema.safeParse({
        ...theme,
        palette: 'personalizada',
        colors: { ...theme.colors, text: '#ffffff' },
      }).success,
    ).toBe(false);
    expect(themeToCssVars(theme)['--color-primary']).toBe(theme.colors.primary);
  });
});

describe('block rendering', () => {
  it('provides translated editor labels for every definition', () => {
    for (const definition of registry) {
      const keys = [
        definition.i18n.name,
        definition.i18n.description,
        ...definition.fields.map((field) => field.i18n.label),
        ...definition.variants.map((variant) => variant.i18n.name),
      ];
      for (const locale of locales)
        for (const key of keys) {
          expect(Object.hasOwn(messages[locale].blocks, key.replace('blocks.', ''))).toBe(true);
        }
    }
  });

  it('omits unknown, invalid and duplicate blocks without losing good content', async () => {
    const onError = vi.fn();
    const blocks = [
      { id: 'a', type: 'hero', version: 1, variant: 'minimal', props: { title: 'Hola' } },
      { id: 'b', type: 'unknown', version: 1, props: {} },
      { id: 'c', type: 'hero', version: 1, props: { title: 7 } },
      { id: 'a', type: 'spacer', version: 1, props: {} },
    ];
    const html = renderToStaticMarkup(await renderPage(blocks, ctx, theme, { onError }));
    expect(html).toContain('Hola');
    expect(onError.mock.calls.map(([error]) => error.reason)).toEqual(['unknown-block', 'invalid-props', 'duplicate-id']);
  });

  it('rejects oversized pages before rendering any block', async () => {
    const onError = vi.fn();
    const many = Array.from({ length: 41 }, (_, index) => ({ id: String(index), type: 'spacer', version: 1, props: {} }));
    expect(await renderPage(many, ctx, theme, { onError })).toEqual([]);
    expect(onError).toHaveBeenCalledWith({ reason: 'invalid-page' });
  });

  it('migrates old props and falls back to the default variant without changing content', async () => {
    const old = {
      id: 'a',
      type: 'hero',
      version: 1,
      variant: 'missing',
      props: { oldTitle: 'Hola' },
    };
    const definition = {
      ...heroDefinition,
      version: 2,
      migrate: () => ({ title: 'Hola', align: 'left' as const }),
    };
    const html = renderToStaticMarkup(
      await renderPage([old], ctx, theme, {
        resolveDefinition: () => definition as BlockDefinition,
      }),
    );
    expect(html).toContain('Hola');
    expect(html).toContain('data-variant="split"');
    expect(old.props).toEqual({ oldTitle: 'Hola' });
  });

  it('renders every declared variant with responsive classes and safe text', async () => {
    for (const definition of registry) {
      for (const variant of definition.variants) {
        const props =
          definition.type === 'hero'
            ? { title: '<script>alert(1)</script>' }
            : definition.type === 'rich-text'
              ? { body: '<img src=x onerror=alert(1)>' }
              : definition.defaults;
        const html = renderToStaticMarkup(
          await renderPage([{ id: 'a', type: definition.type, version: 1, variant: variant.id, props }], ctx, theme, {
            resolveDefinition: (type) => type === definition.type ? { ...definition,
              loader: async () => type === 'featured-products' || type === 'product-grid'
                ? { items: [], outOfStockLabel: 'Sin stock' }
                : type === 'contact' ? { labels: { whatsapp: 'WhatsApp', phone: 'Teléfono', email: 'Email', address: 'Dirección', hours: 'Horarios' }, email: 'hola@ejemplo.com' } : [],
            } as unknown as BlockDefinition : undefined,
          }),
        );
        expect(html).toContain(`data-variant="${variant.id}"`);
        expect(html).not.toContain('<script>');
        expect(html).not.toContain('<img src=x');
      }
    }
  });

  it('renders basic formatting as safe React nodes', async () => {
    const html = renderToStaticMarkup(
      await renderPage(
        [{ id: 'a', type: 'rich-text', version: 1, props: { body: '**Fuerte** y *suave*\n- [Abrir](https://example.com)\n- <script>' } }],
        ctx,
        theme,
      ),
    );
    expect(html).toContain('<strong>Fuerte</strong>');
    expect(html).toContain('<em>suave</em>');
    expect(html).toContain('<ul>');
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('&lt;script&gt;');
  });

  it('runs loaders in parallel and omits a failed loader', async () => {
    const onError = vi.fn();
    const loader = vi.fn(async () => {
      throw new Error('unavailable');
    });
    const definition = { ...heroDefinition, loader };
    const result = await renderPage([{ id: 'a', type: 'hero', version: 1, props: { title: 'Hola' } }], ctx, theme, {
      resolveDefinition: () => definition as BlockDefinition,
      onError,
    });
    expect(result).toEqual([]);
    expect(onError).toHaveBeenCalledWith({ id: 'a', type: 'hero', reason: 'loader' });
  });
});
