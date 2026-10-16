import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { StoreLayout, createTheme, themeSchema } from '@plataforma/blocks';
import { readStorefront, storeSchema } from '../../../lib/storefront-data';
import { catalogLabels } from '../../../lib/catalog-ui';

export default async function SiteLayout({ children, params }: { children: ReactNode; params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(storeId)) notFound();
  const store = (await readStorefront('stores', storeSchema, { id: `eq.${storeId}`, limit: '1' }, [`store:${storeId}`]))[0];
  if (!store) notFound();
  const theme = themeSchema.safeParse(store.theme);
  const host = (await headers()).get('host')?.replace(/:\d+$/, '');
  const homeHref = host === 'localhost' || host === '127.0.0.1' ? `/?tienda=${store.slug}` : '/';
  const labels = catalogLabels(store.default_locale);
  return <StoreLayout theme={theme.success ? theme.data : createTheme()} storeName={store.name} homeHref={homeHref}>
    <form action="/buscar" className="mx-auto flex max-w-6xl gap-2 p-4" role="search">
      <input name="q" aria-label={labels.search} placeholder={labels.search} className="min-h-11 min-w-0 flex-1 rounded border p-3" />
      <button className="min-h-11 rounded bg-slate-900 px-4 text-white">{labels.searchButton}</button>
    </form>
    {children}
  </StoreLayout>;
}
