import { notFound } from 'next/navigation';
import { z } from 'zod';
import { isLocale, messages } from '@plataforma/i18n';
import { cartView } from '../../../../lib/cart-server';
import { catalogStore } from '../../../../lib/catalog-ui';
import { readStorefront } from '../../../../lib/storefront-data';
import { CheckoutSteps } from './checkout-steps';

const shippingSchema = z.object({ id: z.uuid(), name: z.string(), kind: z.enum(['pickup', 'flat_rate', 'local_delivery']),
  price_amount: z.number().int(), free_over_amount: z.number().int().nullable() });
const paymentSchema = z.object({ id: z.uuid(), provider: z.enum(['manual', 'mercadopago']),
  display_name: z.string(), instructions: z.unknown() });

export default async function CheckoutPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await catalogStore(storeId);
  if (!store) notFound();
  const labels = messages[isLocale(store.default_locale) ? store.default_locale : 'es-419'].storefront.checkout;
  const [cart, shipping, payments] = await Promise.all([
    cartView(storeId),
    readStorefront('shipping_methods', shippingSchema, { store_id: `eq.${storeId}` }, [], true),
    readStorefront('payment_methods', paymentSchema, { store_id: `eq.${storeId}` }, [], true),
  ]);
  if (!cart.lines.length || cart.changed) return <main className="mx-auto max-w-xl p-4">
    <h1 className="text-3xl font-bold">{labels.title}</h1><p className="mt-4">{labels.empty}</p>
    <a className="mt-4 inline-flex min-h-11 items-center underline" href={`/carrito?tienda=${store.slug}`}>{labels.adjust}</a>
  </main>;
  return <main className="mx-auto max-w-xl p-4"><h1 className="mb-6 text-3xl font-bold">{labels.title}</h1>
    <CheckoutSteps storeId={storeId} storeSlug={store.slug} currency={store.currency} locale={store.default_locale}
      total={cart.total} shipping={shipping} payments={payments} labels={labels} />
  </main>;
}
