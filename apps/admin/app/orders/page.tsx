import { formatMoney, type CurrencyCode } from '@plataforma/core';
import { z } from 'zod';
import { adminText } from '../../lib/locale';
import { panelContext } from '../../lib/panel-data';
import { PanelShell } from '../panel-shell';

const statuses = ['pending_payment', 'paid', 'preparing', 'ready_for_pickup', 'shipped', 'delivered', 'cancelled', 'refunded'] as const;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ store?: string; status?: string }> }) {
  const [params, t] = await Promise.all([searchParams, adminText()]);
  const context = await panelContext(params.store);
  const active = z.enum(statuses).safeParse(params.status);
  const { data: counts, error: countError } = await context.client.from('orders').select('status')
    .eq('store_id', context.selected.id);
  if (countError) throw countError;
  let query = context.client.from('orders').select('id,number,status,email,total_amount,currency,placed_at')
    .eq('store_id', context.selected.id).order('placed_at', { ascending: false }).limit(100);
  if (active.success) query = query.eq('status', active.data);
  const { data: orders, error } = await query;
  if (error) throw error;
  const totals = new Map(statuses.map((status) => [status, (counts ?? []).filter((item) => item.status === status).length]));
  return <PanelShell context={context} active="orders"><main className="space-y-5 p-4 md:p-8">
    <h1 className="text-3xl font-bold">{t('ordersPanel.title')}</h1>
    <nav aria-label={t('ordersPanel.filters')} className="flex flex-wrap gap-2">
      <a className="auth-secondary" aria-current={!active.success ? 'page' : undefined}
        href={`/orders?store=${context.selected.id}`}>{t('ordersPanel.all')} ({counts?.length ?? 0})</a>
      {statuses.map((status) => <a key={status} className="auth-secondary" aria-current={active.data === status ? 'page' : undefined}
        href={`/orders?store=${context.selected.id}&status=${status}`}>
        {t(`ordersPanel.status.${status}`)} ({totals.get(status) ?? 0})</a>)}
    </nav>
    {orders?.length ? <ul className="grid gap-3">{orders.map((order) => <li key={order.id}>
      <a className="block min-h-16 rounded-xl border border-[#2a2f3c] p-4 hover:bg-[#13161e]"
        href={`/orders/${order.id}?store=${context.selected.id}`}>
        <strong>#{order.number}</strong> · {t(`ordersPanel.status.${order.status}`)}
        <span className="block break-all">{order.email}</span>
        <span>{formatMoney({ amount: BigInt(order.total_amount), currency: order.currency as CurrencyCode }, 'es-AR')}</span>
      </a></li>)}</ul> : <p className="rounded-xl border border-[#2a2f3c] p-6">{t('ordersPanel.empty')}</p>}
  </main></PanelShell>;
}
