import { z } from 'zod';

export const storeSchema = z.object({ id: z.uuid(), name: z.string(), slug: z.string(), default_locale: z.string(), theme: z.unknown() });
export const pageSchema = z.object({ id: z.uuid(), store_id: z.uuid(), slug: z.string().nullable(), kind: z.string(), blocks: z.unknown() });
export const mediaSchema = z.object({ id: z.uuid(), path: z.string() });
export const domainSchema = z.object({ hostname: z.string(), store_id: z.uuid() });

export async function readStorefront<T extends z.ZodType>(
  view: string, schema: T, filters: Record<string, string>, tags: string[],
): Promise<z.infer<T>[]> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) throw new Error('Missing public Supabase settings');
  const url = new URL(`rest/v1/${view}`, `${base.replace(/\/$/, '')}/`);
  url.searchParams.set('select', '*');
  for (const [name, value] of Object.entries(filters)) url.searchParams.set(name, value);
  const init: RequestInit & { next: { tags: string[]; revalidate: number } } = {
    headers: { apikey: key, 'Accept-Profile': 'storefront' }, next: { tags, revalidate: 300 },
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
