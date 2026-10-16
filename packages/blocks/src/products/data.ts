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

async function readView<T extends z.ZodType>(view: string, schema: T, ctx: StoreContext, filters: Record<string, string> = {}): Promise<z.infer<T>[]> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) throw new Error('Missing public Supabase settings');
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
