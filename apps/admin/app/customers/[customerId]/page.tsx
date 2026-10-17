import { notFound } from 'next/navigation';
import { z } from 'zod';
import { formatMoney, type CurrencyCode } from '@plataforma/core';
import { adminText } from '../../../lib/locale';
import { panelContext } from '../../../lib/panel-data';
import { PanelShell } from '../../panel-shell';
import { CustomerNote } from './customer-note';

export default async function CustomerPage({ params, searchParams }: { params: Promise<{ customerId: string }>; searchParams: Promise<{ store?: string }> }) {
  const [{ customerId }, search, t] = await Promise.all([params, searchParams, adminText()]);
  if (!z.uuid().safeParse(customerId).success) notFound();
  const context = await panelContext(search.store);
  const [customer, orders, store] = await Promise.all([
    context.client.from('customers').select('id,full_name,email,phone,notes').eq('store_id', context.selected.id).eq('id', customerId).maybeSingle(),
    context.client.from('orders').select('id,number,status,total_amount,currency').eq('store_id', context.selected.id)
      .eq('customer_id', customerId).order('placed_at', { ascending: false }).limit(100),
    context.client.from('stores').select('currency,default_locale').eq('id', context.selected.id).single(),
  ]);
  if (customer.error || orders.error || store.error) throw customer.error ?? orders.error ?? store.error;
  if (!customer.data || !store.data) notFound();
  const spent = (orders.data ?? []).filter((order) => ['paid', 'preparing', 'ready_for_pickup', 'shipped', 'delivered'].includes(order.status))
    .reduce((sum, order) => sum + BigInt(order.total_amount), 0n);
  return <PanelShell context={context} active="customers"><main className="space-y-5 p-4 md:p-8">
    <a className="inline-flex min-h-11 items-center" href={`/customers?store=${context.selected.id}`}>{t('customersPanel.back')}</a>
    <h1 className="text-3xl font-bold">{customer.data.full_name || customer.data.email}</h1>
    <p>{customer.data.email} {customer.data.phone}</p>
    <p>{t('customersPanel.orders')}: {orders.data?.length ?? 0} · {t('customersPanel.spent')}: {formatMoney({ amount: spent,
      currency: store.data.currency as CurrencyCode }, store.data.default_locale)}</p>
    <CustomerNote storeId={context.selected.id} customerId={customerId} initial={customer.data.notes ?? ''}
      labels={{ note: t('customersPanel.note'), save: t('customersPanel.save'), saved: t('customersPanel.saved'), error: t('customersPanel.error') }} />
    <h2 className="text-xl font-bold">{t('customersPanel.orders')}</h2>
    <ul className="grid gap-3">{(orders.data ?? []).map((order) => <li key={order.id}><a className="block min-h-11 rounded border p-3"
      href={`/orders/${order.id}?store=${context.selected.id}`}>#{order.number} · {t(`ordersPanel.status.${order.status}`)} · {formatMoney({
        amount: BigInt(order.total_amount), currency: order.currency as CurrencyCode }, store.data.default_locale)}</a></li>)}</ul>
  </main></PanelShell>;
}
