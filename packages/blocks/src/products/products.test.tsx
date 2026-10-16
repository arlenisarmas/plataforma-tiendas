import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadProducts } from './data';
import { ProductCollection } from './component';
import { featuredProductsSchema, categoryGridSchema, productGridSchema } from './schema';

const storeId = 'd34c202c-716a-455c-ab09-88888a460faa';
const productId = '90b31966-b37d-4468-a1d6-00ec5aa706e5';
const variantId = 'c531762b-286b-4a29-a297-8579f2924f28';
const ctx = { storeId, locale: 'es-AR', assetUrl: () => undefined };

afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe('product blocks', () => {
  it('validates defaults and rejects invalid limits', () => {
    for (const schema of [featuredProductsSchema, categoryGridSchema, productGridSchema]) {
      expect(schema.safeParse({}).success).toBe(true);
      expect(schema.safeParse({ limit: 100 }).success).toBe(false);
    }
  });

  it('reads only published storefront views with a store filter', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'public-key');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = new URL(String(input));
      expect(init?.headers).toMatchObject({ 'Accept-Profile': 'storefront' });
      expect(url.searchParams.get(url.pathname.endsWith('/stores') ? 'id' : 'store_id')).toBe(`eq.${storeId}`);
      const rows: Record<string, unknown[]> = {
        products: [{ id: productId, store_id: storeId, name: 'Mesa', slug: 'mesa', is_featured: true, category_id: null }],
        variants: [{ id: variantId, store_id: storeId, product_id: productId, price_amount: 15500, compare_at_amount: null, is_available: true, is_default: true }],
        product_images: [], stores: [{ id: storeId, currency: 'ARS' }],
      };
      return new Response(JSON.stringify(rows[url.pathname.split('/').at(-1) ?? '']), { status: 200 });
    });
    expect((await loadProducts(ctx, 8, { is_featured: 'eq.true' }))[0]?.variant?.price_amount).toBe(15500);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it.each([['ARS', '155,00'], ['CLP', '15.500']])('formats %s without floating point', async (currency, expected) => {
    const html = renderToStaticMarkup(<ProductCollection props={{ title: 'Destacados' }} variant="grid" ctx={ctx}
      data={{ outOfStockLabel: 'Sin stock', items: [{ id: productId, store_id: storeId, name: 'Mesa', slug: 'mesa', is_featured: true, category_id: null,
        variant: { id: variantId, store_id: storeId, product_id: productId, price_amount: 15500, compare_at_amount: null, is_available: false, is_default: true },
        image: undefined, currency }] }} />);
    expect(html).toContain('Destacados');
    expect(html).toContain(expected);
    expect(html).toContain('Sin stock');
  });
});
