import { notFound } from 'next/navigation';
import { cartView } from '../../../../lib/cart-server';
import { catalogStore } from '../../../../lib/catalog-ui';
import { isLocale, messages } from '@plataforma/i18n';
import { CartLines } from './cart-lines';

export default async function CartPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await catalogStore(storeId);
  if (!store) notFound();
  const labels = messages[isLocale(store.default_locale) ? store.default_locale : 'es-419'].storefront.cart;
  const cart = await cartView(storeId);
  return <main className="mx-auto max-w-4xl p-4"><h1 className="mb-6 text-3xl font-bold">{labels.title}</h1>
    {cart.changed && <p role="status" className="mb-4 rounded border border-amber-500 p-3">{labels.adjusted}</p>}
    <CartLines storeId={storeId} storeSlug={store.slug} lines={cart.lines} currency={store.currency} locale={store.default_locale}
      labels={labels} changed={cart.changed} />
  </main>;
}
