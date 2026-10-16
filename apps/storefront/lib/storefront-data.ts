import { z } from 'zod';

export const storeSchema = z.object({ id: z.uuid(), name: z.string(), slug: z.string(), default_locale: z.string(),
  currency: z.enum(['ARS', 'CLP', 'USD']), theme: z.unknown() });
export const pageSchema = z.object({ id: z.uuid(), store_id: z.uuid(), slug: z.string().nullable(), kind: z.string(), blocks: z.unknown() });
export const mediaSchema = z.object({ id: z.uuid(), path: z.string() });
export const domainSchema = z.object({ hostname: z.string(), store_id: z.uuid() });
export const categorySchema = z.object({ id: z.uuid(), store_id: z.uuid(), name: z.string(), slug: z.string(),
  description: z.string().nullable(), parent_id: z.uuid().nullable(), position: z.number() });
export const productSchema = z.object({ id: z.uuid(), store_id: z.uuid(), category_id: z.uuid().nullable(),
  name: z.string(), slug: z.string(), description: z.string().nullable(), seo: z.unknown(), created_at: z.string() });
export const variantSchema = z.object({ id: z.uuid(), product_id: z.uuid(), title: z.string(), options: z.unknown(),
  price_amount: z.number().int().nonnegative(), available_quantity: z.number().int().nullable(), is_available: z.boolean(),
  is_default: z.boolean(), position: z.number() });
export const productImageSchema = z.object({ product_id: z.uuid(), path: z.string(), alt_text: z.string().nullable(), position: z.number() });

export function mediaUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) throw new Error('Missing public Supabase URL');
  return `${base.replace(/\/$/, '')}/storage/v1/object/public/store-media/${path.split('/').map(encodeURIComponent).join('/')}`;
}

export async function readStorefront<T extends z.ZodType>(
  view: string, schema: T, filters: Record<string, string>, tags: string[], live = false,
): Promise<z.infer<T>[]> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) throw new Error('Missing public Supabase settings');
  const url = new URL(`rest/v1/${view}`, `${base.replace(/\/$/, '')}/`);
  url.searchParams.set('select', '*');
  for (const [name, value] of Object.entries(filters)) url.searchParams.set(name, value);
  const init: RequestInit = { headers: { apikey: key, 'Accept-Profile': 'storefront' },
    ...(live ? { cache: 'no-store' } : { next: { tags, revalidate: 300 } }),
  };
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`Storefront view ${view} unavailable`);
  return z.array(schema).parse(await response.json());
}

export async function findStoreByHost(host: string, slug?: string): Promise<string | undefined> {
  if (slug) {
    if (!/^[a-z0-9](-?[a-z0-9])*$/.test(slug)) return undefined;
    return (await readStorefront('stores', storeSchema, { slug: `eq.${slug}`, limit: '1' }, [`domain:${host}`]))[0]?.id;
  }
  if (!/^[a-z0-9.-]{1,253}$/.test(host)) return undefined;
  return (await readStorefront('domains', domainSchema, { hostname: `eq.${host}`, limit: '1' }, [`domain:${host}`]))[0]?.store_id;
}
