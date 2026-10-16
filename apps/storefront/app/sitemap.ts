import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { z } from 'zod';
import { findStoreByHost, readStorefront } from '../lib/storefront-data';
import { publicPaths, storeUrl } from '../lib/seo';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const host = (await headers()).get('host') ?? '';
  const origin = storeUrl(host);
  if (!origin) return [];
  const storeId = await findStoreByHost(origin.host);
  if (!storeId) return [];
  const [pages, products] = await Promise.all([
    readStorefront('pages', z.object({ slug: z.string().nullable() }), { store_id: `eq.${storeId}` }, [`store:${storeId}`]),
    readStorefront('products', z.object({ slug: z.string() }), { store_id: `eq.${storeId}` }, [`store:${storeId}`]),
  ]);
  return publicPaths(pages, products).map((path) => ({ url: new URL(path, origin).toString() }));
}
