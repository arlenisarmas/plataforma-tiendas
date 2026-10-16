import { formatMoney, type CurrencyCode } from '@plataforma/core';
import { adminText } from '../../lib/locale';
import { panelContext } from '../../lib/panel-data';
import { PanelShell } from '../panel-shell';

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ store?: string }> }) {
  const [params, t] = await Promise.all([searchParams, adminText()]);
  const context = await panelContext(params.store);
  const [customers, orders, store] = await Promise.all([
    context.client.from('customers').select('id,full_name,email,phone').eq('store_id', context.selected.id).order('created_at', { ascending: false }).limit(200),
    context.client.from('orders').select('customer_id,total_amount,status').eq('store_id', context.selected.id).limit(1000),
    context.client.from('stores').select('currency,default_locale').eq('id', context.selected.id).single(),
  ]);
  if (customers.error || orders.error || store.error || !store.data) throw customers.error ?? orders.error ?? store.error;
  const summary = new Map<string, { count: number; amount: bigint }>();
  for (const order of orders.data ?? []) if (order.customer_id) {
    const row = summary.get(order.customer_id) ?? { count: 0, amount: 0n };
    row.count++;
    if (['paid', 'preparing', 'ready_for_pickup', 'shipped', 'delivered'].includes(order.status))
      row.amount += BigInt(order.total_amount);
    summary.set(order.customer_id, row);
  }
  return <PanelShell context={context} active="customers"><main className="space-y-5 p-4 md:p-8">
    <h1 className="text-3xl font-bold">{t('customersPanel.title')}</h1>
    <a className="auth-secondary" href={`/customers/team?store=${context.selected.id}`}>{t('customersPanel.team')}</a>
    {customers.data?.length ? <ul className="grid gap-3">{customers.data.map((customer) => {
      const value = summary.get(customer.id) ?? { count: 0, amount: 0n };
      return <li key={customer.id}><a className="block min-h-16 rounded-xl border p-4" href={`/customers/${customer.id}?store=${context.selected.id}`}>
        <strong>{customer.full_name || customer.email}</strong><span className="block">{customer.email}</span>
        <span>{t('customersPanel.orders')}: {value.count} · {formatMoney({ amount: value.amount,
          currency: store.data.currency as CurrencyCode }, store.data.default_locale)}</span>
      </a></li>;
    })}</ul> : <p className="rounded-xl border p-6">{t('customersPanel.empty')}</p>}
  </main></PanelShell>;
}
