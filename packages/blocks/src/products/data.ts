import { z } from 'zod';
import type { StoreContext } from '../types';

const row = z.object({ id: z.string().uuid(), store_id: z.string().uuid() });
const product = row.extend({ name: z.string(), slug: z.string(), is_featured: z.boolean().nullable(), category_id: z.string().uuid().nullable() });
const variant = row.extend({ product_id: z.string().uuid(), price_amount: z.number().int().safe(), compare_at_amount: z.number().int().safe().nullable(), is_available: z.boolean(), is_default: z.boolean().nullable() });
const image = z.object({ product_id: z.string().uuid(), store_id: z.string().uuid(), asset_id: z.string().uuid(), alt_text: z.string().nullable(), position: z.number().int().nullable() });
const category = row.extend({ name: z.string(), slug: z.string(), image_asset_id: z.string().uuid().nullable().optional() });
const store = z.object({ id: z.string().uuid(), currency: z.enum(['ARS', 'CLP', 'USD', 'EUR', 'MXN', 'COP', 'PEN', 'UYU', 'BRL', 'VES']) });

type Product = z.infer<typeof product>;
type Variant = z.infer<typeof variant>;
type Image = z.infer<typeof image>;
export type ProductCardData = Product & { variant: Variant | undefined; image: Image | undefined; currency: z.infer<typeof store>['currency'] };
export type CategoryData = z.infer<typeof category>;

const previewCache = new WeakMap<StoreContext, Map<string, Promise<unknown[]>>>();

/** Filtros simples de PostgREST (`eq.` y `limit`) aplicados en memoria a las filas de la vista previa. */
export function applyFilters(rows: unknown[], filters: Record<string, string>): unknown[] {
  let result = rows;
  for (const [name, value] of Object.entries(filters)) {
    if (name === 'limit' || !value.startsWith('eq.')) continue;
    const expected = value.slice(3);
    result = result.filter((row) => typeof row === 'object' && row !== null && String((row as Record<string, unknown>)[name]) === expected);
  }
  const limit = Number(filters.limit);
  return Number.isInteger(limit) && limit > 0 ? result.slice(0, limit) : result;
}

async function previewRows(view: string, ctx: StoreContext, accessToken: string, base: string, key: string): Promise<unknown[]> {
  let cache = previewCache.get(ctx);
  if (!cache) { cache = new Map(); previewCache.set(ctx, cache); }
  let pending = cache.get(view);
  if (!pending) {
    pending = fetch(new URL('rest/v1/rpc/preview_storefront_rows', `${base.replace(/\/$/, '')}/`), {
      method: 'POST', cache: 'no-store',
      headers: { apikey: key, Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_store_id: ctx.storeId, p_view: view }),
    }).then(async (response) => {
      if (!response.ok) throw new Error(`Preview view ${view} unavailable`);
      return z.array(z.unknown()).parse(await response.json());
    });
    cache.set(view, pending);
  }
  return pending;
}

export async function readView<T extends z.ZodType>(view: string, schema: T, ctx: StoreContext, filters: Record<string, string> = {}): Promise<z.infer<T>[]> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) throw new Error('Missing public Supabase settings');
  if (ctx.preview) {
    return z.array(schema).parse(applyFilters(await previewRows(view, ctx, ctx.preview.accessToken, base, key), filters));
  }
  const url = new URL(`rest/v1/${view}`, `${base.replace(/\/$/, '')}/`);
  url.searchParams.set('select', '*');
  url.searchParams.set(view === 'stores' ? 'id' : 'store_id', `eq.${ctx.storeId}`);
  for (const [name, value] of Object.entries(filters)) url.searchParams.set(name, value);
  const init: RequestInit & { next: { tags: string[] } } = {
    headers: { apikey: key, 'Accept-Profile': 'storefront' }, next: { tags: [`store:${ctx.storeId}`] },
  };
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`Storefront view ${view} unavailable`);
  return z.array(schema).parse(await response.json());
}

export async function loadProducts(ctx: StoreContext, limit: number, filters: Record<string, string> = {}): Promise<ProductCardData[]> {
  const [products, variants, images, stores] = await Promise.all([
    readView('products', product, ctx, { ...filters, limit: String(limit) }),
    readView('variants', variant, ctx), readView('product_images', image, ctx), readView('stores', store, ctx, { limit: '1' }),
  ]);
  const currency = stores[0]?.currency;
  if (!currency) throw new Error('Store currency unavailable');
  return products.map((item) => ({ ...item, currency,
    variant: variants.find((entry) => entry.product_id === item.id && entry.is_default) ?? variants.find((entry) => entry.product_id === item.id),
    image: images.filter((entry) => entry.product_id === item.id).sort((a, b) => (a.position ?? 0) - (b.position ?? 0))[0],
  }));
}

export async function loadCategories(ctx: StoreContext, limit: number): Promise<CategoryData[]> {
  return readView('categories', category, ctx, { limit: String(limit) });
}
