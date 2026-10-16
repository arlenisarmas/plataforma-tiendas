import type { panelContext } from './panel-data';
import type { PublishChecks } from './publish-checks';

export async function publishChecks(storeId: string, client: Awaited<ReturnType<typeof panelContext>>['client']): Promise<PublishChecks> {
  const [home, product, payment, shipping] = await Promise.all([
    client.from('pages').select('id', { head: true, count: 'exact' }).eq('store_id', storeId).eq('kind', 'home')
      .not('published_version_id', 'is', null),
    client.from('products').select('id', { head: true, count: 'exact' }).eq('store_id', storeId).eq('status', 'active'),
    client.from('store_payment_methods').select('id', { head: true, count: 'exact' }).eq('store_id', storeId).eq('is_enabled', true),
    client.from('shipping_methods').select('id', { head: true, count: 'exact' }).eq('store_id', storeId).eq('is_active', true),
  ]);
  if ([home, product, payment, shipping].some((item) => item.error)) throw new Error('Store readiness unavailable');
  return { home: (home.count ?? 0) > 0, product: (product.count ?? 0) > 0,
    payment: (payment.count ?? 0) > 0, shipping: (shipping.count ?? 0) > 0 };
}
