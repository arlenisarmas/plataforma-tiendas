import { notFound } from 'next/navigation';
import { z } from 'zod';
import { adminText } from '../../../lib/locale';
import { panelContext } from '../../../lib/panel-data';
import { PanelShell } from '../../panel-shell';
import { StockControl } from './stock-control';

export default async function ProductDetail({ params, searchParams }: { params: Promise<{ productId: string }>;
  searchParams: Promise<{ store?: string }> }) {
  const [{ productId }, query, t] = await Promise.all([params, searchParams, adminText()]);
  if (!z.uuid().safeParse(productId).success) notFound();
  const context = await panelContext(query.store);
  const storeId = context.selected.id;
  const { data: product } = await context.client.from('products').select('id,name').eq('store_id', storeId).eq('id', productId).maybeSingle();
  if (!product) notFound();
  const { data: variants, error } = await context.client.from('product_variants').select('id,title')
    .eq('store_id', storeId).eq('product_id', productId).order('position');
  if (error) throw error;
  const ids = (variants ?? []).map((variant) => variant.id);
  const [balances, movements] = await Promise.all([
    ids.length ? context.client.from('inventory').select('variant_id,on_hand,reserved').eq('store_id', storeId).in('variant_id', ids) : Promise.resolve({ data: [] }),
    ids.length ? context.client.from('inventory_movements').select('variant_id,delta,reason,note,created_at').eq('store_id', storeId)
      .in('variant_id', ids).order('created_at', { ascending: false }).limit(30) : Promise.resolve({ data: [] }),
  ]);
  const balance = new Map((balances.data ?? []).map((row) => [row.variant_id, row]));
  return <PanelShell context={context} active="products"><main className="space-y-5 p-4 md:p-8">
    <h1 className="text-3xl font-bold">{product.name}</h1>
    {(variants ?? []).map((variant) => <section key={variant.id} className="space-y-3 rounded-xl border border-[#2a2f3c] p-4">
      <h2 className="text-xl font-bold">{variant.title}</h2>
      <p>{t('products.stock')}: {balance.get(variant.id)?.on_hand ?? 0}</p>
      <StockControl storeId={storeId} variantId={variant.id} onHand={balance.get(variant.id)?.on_hand ?? 0}
        labels={{ add: t('products.addUnits'), correct: t('products.correctStock'), delta: t('products.delta'),
          note: t('products.note'), error: t('products.stockError') }} />
    </section>)}
    <section><h2 className="text-xl font-bold">{t('products.history')}</h2><ul className="space-y-2">
      {(movements.data ?? []).map((item, index) => <li key={`${item.variant_id}-${item.created_at}-${index}`} className="rounded-lg border border-[#2a2f3c] p-3">
        <time dateTime={item.created_at}>{new Date(item.created_at).toLocaleDateString()}</time> · {item.delta > 0 ? '+' : ''}{item.delta} · {item.reason}
        {item.note && <p>{item.note}</p>}
      </li>)}</ul></section>
  </main></PanelShell>;
}
