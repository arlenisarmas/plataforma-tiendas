import { notFound } from 'next/navigation';
import { formatMoney, type CurrencyCode } from '@plataforma/core';
import { z } from 'zod';
import { adminText } from '../../../lib/locale';
import { panelContext } from '../../../lib/panel-data';
import { nextOrderStatuses } from '../../../lib/order-status';
import { PanelShell } from '../../panel-shell';
import { OrderControls } from './order-controls';

export default async function OrderPage({ params, searchParams }: { params: Promise<{ orderId: string }>; searchParams: Promise<{ store?: string }> }) {
  const [{ orderId }, search, t] = await Promise.all([params, searchParams, adminText()]);
  if (!z.uuid().safeParse(orderId).success) notFound();
  const context = await panelContext(search.store);
  const { data: order, error } = await context.client.from('orders').select('id,number,status,email,total_amount,subtotal_amount,shipping_amount,currency,placed_at,shipping_snapshot,shipping_address,internal_note,customer_id')
    .eq('store_id', context.selected.id).eq('id', orderId).maybeSingle();
  if (error) throw error;
  if (!order) notFound();
  const [items, payments, customer] = await Promise.all([
    context.client.from('order_items').select('id,product_name,variant_title,quantity,line_total_amount').eq('store_id', context.selected.id).eq('order_id', orderId),
    context.client.from('payments').select('id,provider,status,receipt_asset_id').eq('store_id', context.selected.id).eq('order_id', orderId),
    order.customer_id ? context.client.from('customers').select('full_name,phone').eq('store_id', context.selected.id).eq('id', order.customer_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  if (items.error || payments.error || customer.error) throw items.error ?? payments.error ?? customer.error;
  const receiptIds = (payments.data ?? []).flatMap((payment) => payment.receipt_asset_id ? [payment.receipt_asset_id] : []);
  const { data: assets, error: assetError } = receiptIds.length ? await context.client.from('media_assets')
    .select('id,path').eq('store_id', context.selected.id).in('id', receiptIds) : { data: [], error: null };
  if (assetError) throw assetError;
  const receipts = await Promise.all((assets ?? []).map(async (asset) => ({ id: asset.id,
    url: (await context.client.storage.from('payment-receipts').createSignedUrl(asset.path, 300)).data?.signedUrl ?? '' })));
  const kind = z.object({ kind: z.string() }).safeParse(order.shipping_snapshot);
  const next = nextOrderStatuses(order.status, kind.success ? kind.data.kind : undefined);
  const address = z.object({ line1: z.string(), city: z.string(), postalCode: z.string() }).safeParse(order.shipping_address);
  const phone = customer.data?.phone?.replace(/\D/g, '') ?? '';
  const labels = { next: t('ordersPanel.next'), manualPayment: t('ordersPanel.manualPayment'),
    receipt: t('ordersPanel.receipt'), approve: t('ordersPanel.approve'), reject: t('ordersPanel.reject'),
    rejectConfirm: t('ordersPanel.rejectConfirm'), cancelConfirm: t('ordersPanel.cancelConfirm'),
    note: t('ordersPanel.note'), save: t('ordersPanel.save'),
    saved: t('ordersPanel.saved'), error: t('ordersPanel.error'),
    mark: Object.fromEntries(next.map((status) => [status, t(`ordersPanel.mark.${status}`)])),
    paymentStatus: Object.fromEntries((payments.data ?? []).map((payment) =>
      [payment.status, t(`ordersPanel.paymentStatus.${payment.status}`)])) };
  return <PanelShell context={context} active="orders"><main className="space-y-6 p-4 md:p-8">
    <a className="inline-flex min-h-11 items-center" href={`/orders?store=${context.selected.id}`}>{t('ordersPanel.back')}</a>
    <h1 className="text-3xl font-bold">{t('ordersPanel.order')} #{order.number}</h1>
    <p>{t(`ordersPanel.status.${order.status}`)} · {order.email}</p>
    {phone && <a className="auth-secondary" href={`https://wa.me/${phone}`} target="_blank" rel="noopener noreferrer">{t('ordersPanel.whatsapp')}</a>}
    <section className="space-y-3 rounded-xl border p-4"><h2 className="text-xl font-bold">{t('ordersPanel.items')}</h2>
      {(items.data ?? []).map((item) => <p key={item.id}>{item.product_name} · {item.variant_title} × {item.quantity} — {formatMoney({ amount: BigInt(item.line_total_amount), currency: order.currency as CurrencyCode }, 'es-AR')}</p>)}
      <p>{t('ordersPanel.shipping')}: {formatMoney({ amount: BigInt(order.shipping_amount), currency: order.currency as CurrencyCode }, 'es-AR')}</p>
      <strong>{t('ordersPanel.total')}: {formatMoney({ amount: BigInt(order.total_amount), currency: order.currency as CurrencyCode }, 'es-AR')}</strong>
      {address.success && <p>{address.data.line1}, {address.data.city}, {address.data.postalCode}</p>}
    </section>
    <OrderControls storeId={context.selected.id} orderId={order.id} next={next} note={order.internal_note ?? ''}
      labels={labels} payments={(payments.data ?? []).map((payment) => ({ ...payment, receiptUrl: receipts.find((receipt) => receipt.id === payment.receipt_asset_id)?.url ?? '' }))} />
  </main></PanelShell>;
}
