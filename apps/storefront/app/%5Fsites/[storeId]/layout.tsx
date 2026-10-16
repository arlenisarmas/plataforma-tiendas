import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { StoreLayout, createTheme, themeSchema } from '@plataforma/blocks';
import { readStorefront, storeSchema } from '../../../lib/storefront-data';

export default async function SiteLayout({ children, params }: { children: ReactNode; params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(storeId)) notFound();
  const store = (await readStorefront('stores', storeSchema, { id: `eq.${storeId}`, limit: '1' }, [`store:${storeId}`]))[0];
  if (!store) notFound();
  const theme = themeSchema.safeParse(store.theme);
  const host = (await headers()).get('host')?.replace(/:\d+$/, '');
  const homeHref = host === 'localhost' || host === '127.0.0.1' ? `/?tienda=${store.slug}` : '/';
  return <StoreLayout theme={theme.success ? theme.data : createTheme()} storeName={store.name} homeHref={homeHref}>
    {children}
  </StoreLayout>;
}
