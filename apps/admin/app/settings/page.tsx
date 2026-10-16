import { fromMinor, type CurrencyCode } from '@plataforma/core';
import { z } from 'zod';
import { adminText } from '../../lib/locale';
import { panelContext } from '../../lib/panel-data';
import { PanelShell } from '../panel-shell';
import { SettingsForms } from './settings-forms';

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ store?: string }> }) {
  const [params, t] = await Promise.all([searchParams, adminText()]);
  const context = await panelContext(params.store);
  const storeId = context.selected.id;
  const [shipping, payments, store] = await Promise.all([
    context.client.from('shipping_methods').select('id,name,kind,description,price_amount,free_over_amount').eq('store_id', storeId).order('position'),
    context.client.from('store_payment_methods').select('method_key').eq('store_id', storeId).eq('provider', 'manual').eq('is_enabled', true),
    context.client.from('stores').select('currency,default_locale').eq('id', storeId).single(),
  ]);
  const failure = [shipping, payments, store].find((result) => result.error)?.error;
  if (failure || !store.data) throw failure ?? new Error('Store unavailable');
  const currency = store.data.currency as CurrencyCode;
  const format = (amount: number | null) => amount === null ? '' : fromMinor(BigInt(amount), currency, store.data.default_locale);
  const keys = ['title', 'shipping', 'payment', 'pickup', 'flatRate', 'name', 'description', 'price',
    'freeOver', 'save', 'saved', 'error', 'method', 'transfer', 'mobile', 'zelle', 'cash', 'holder',
    'bank', 'account', 'phone', 'email', 'note', 'mercadoPago', 'comingSoon', 'configured'] as const;
  const labels = Object.fromEntries(keys.map((key) => [key, t(`commerce.${key}`)])) as Record<(typeof keys)[number], string>;
  const methodSchema = z.enum(['transferencia', 'pago-movil', 'zelle', 'efectivo']);
  return <PanelShell context={context} active="settings"><main className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
    <h1 className="text-3xl font-bold">{labels.title}</h1>
    <SettingsForms storeId={storeId} labels={labels} shipping={(shipping.data ?? []).filter((item) =>
      item.kind === 'pickup' || item.kind === 'flat_rate').map((item) => ({ ...item,
      kind: item.kind as 'pickup' | 'flat_rate', price: format(item.price_amount), freeOver: format(item.free_over_amount) }))}
      methods={(payments.data ?? []).map((item) => methodSchema.safeParse(item.method_key)).filter((result) => result.success)
        .map((result) => result.data)} />
  </main></PanelShell>;
}
