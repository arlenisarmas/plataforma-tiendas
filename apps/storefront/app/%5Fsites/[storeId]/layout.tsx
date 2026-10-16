import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { StoreLayout, createTheme, themeSchema } from '@plataforma/blocks';
import { readStorefront, storeSchema } from '../../../lib/storefront-data';
import { catalogLabels } from '../../../lib/catalog-ui';
import { z } from 'zod';
import { currentCart } from '../../../lib/cart-server';
import { isLocale, messages } from '@plataforma/i18n';

export async function generateMetadata({ params }: { params: Promise<{ storeId: string }> }): Promise<Metadata> {
  const { storeId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(storeId)) return {};
  const store = (await readStorefront('stores', storeSchema, { id: `eq.${storeId}`, limit: '1' }, [`store:${storeId}`]))[0];
  return store ? { title: { default: store.name, template: `%s · ${store.name}` } } : {};
}

export default async function SiteLayout({ children, params }: { children: ReactNode; params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(storeId)) notFound();
  const store = (await readStorefront('stores', storeSchema, { id: `eq.${storeId}`, limit: '1' }, [`store:${storeId}`]))[0];
  if (!store) notFound();
  const theme = themeSchema.safeParse(store.theme);
  const host = (await headers()).get('host')?.replace(/:\d+$/, '');
  const homeHref = host === 'localhost' || host === '127.0.0.1' ? `/?tienda=${store.slug}` : '/';
  const cartHref = host === 'localhost' || host === '127.0.0.1' ? `/carrito?tienda=${store.slug}` : '/carrito';
  const labels = catalogLabels(store.default_locale);
  const cartLabels = messages[isLocale(store.default_locale) ? store.default_locale : 'es-419'].storefront.cart;
  const cart = await currentCart(storeId);
  const cartCount = cart.items.reduce((count, item) => count + item.quantity, 0);
  const navigation = await readStorefront('pages', z.object({ id: z.uuid(), slug: z.string(), title: z.string(),
    show_in_nav: z.boolean(), nav_position: z.number() }), { store_id: `eq.${storeId}`, show_in_nav: 'eq.true',
    order: 'nav_position.asc' }, [`store:${storeId}`]);
  return <StoreLayout theme={theme.success ? theme.data : createTheme()} storeName={store.name} homeHref={homeHref}>
    <nav className="mx-auto flex max-w-6xl flex-wrap gap-3 px-4 py-2" aria-label={labels.nav}>
      <Link href={cartHref} className="min-h-11 rounded px-2 py-3 underline">{cartLabels.title} ({cartCount})</Link>
      {navigation.map((page) => <a key={page.id} href={page.slug ? `/${page.slug}` : homeHref}
        className="min-h-11 rounded px-2 py-3 underline">{page.title}</a>)}
    </nav>
    <form action="/buscar" className="mx-auto flex max-w-6xl gap-2 p-4" role="search">
      <input name="q" aria-label={labels.search} placeholder={labels.search} className="min-h-11 min-w-0 flex-1 rounded border p-3" />
      <button className="min-h-11 rounded bg-slate-900 px-4 text-white">{labels.searchButton}</button>
    </form>
    {children}
  </StoreLayout>;
}
