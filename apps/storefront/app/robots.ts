import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { findStoreByHost } from '../lib/storefront-data';
import { storeUrl } from '../lib/seo';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const origin = storeUrl((await headers()).get('host') ?? '');
  const storeId = origin && await findStoreByHost(origin.host);
  if (!origin || !storeId) return { rules: { userAgent: '*', disallow: '/' } };
  return { rules: { userAgent: '*', allow: '/', disallow: ['/carrito', '/finalizar', '/pedido', '/buscar', '/preview'] },
    sitemap: new URL('/sitemap.xml', origin).toString() };
}
