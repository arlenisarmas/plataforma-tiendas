import { fromMinor, type CurrencyCode } from '@plataforma/core';
import { z } from 'zod';
import { adminText } from '../../lib/locale';
import { panelContext } from '../../lib/panel-data';
import { PanelShell } from '../panel-shell';
import { SettingsForms } from './settings-forms';
import { StoreDetails } from './store-details';
import { LegalDrafts } from './legal-drafts';
import { socialLink } from '../../lib/store-details-data';

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ store?: string }> }) {
  const [params, t] = await Promise.all([searchParams, adminText()]);
  const context = await panelContext(params.store);
  const storeId = context.selected.id;
  const [shipping, payments, mercadoPago, store, legalPages] = await Promise.all([
    context.client.from('shipping_methods').select('id,name,kind,description,price_amount,free_over_amount').eq('store_id', storeId).order('position'),
    context.client.from('store_payment_methods').select('method_key').eq('store_id', storeId).eq('provider', 'manual').eq('is_enabled', true),
    context.client.from('store_payment_methods').select('id').eq('store_id', storeId).eq('provider', 'mercadopago').eq('is_enabled', true).maybeSingle(),
    context.client.from('stores').select('currency,default_locale,contact').eq('id', storeId).single(),
    context.client.from('pages').select('id,slug').eq('store_id', storeId).eq('kind', 'legal'),
  ]);
  const failure = [shipping, payments, mercadoPago, store, legalPages].find((result) => result.error)?.error;
  if (failure || !store.data) throw failure ?? new Error('Store unavailable');
  const currency = store.data.currency as CurrencyCode;
  const format = (amount: number | null) => amount === null ? '' : fromMinor(BigInt(amount), currency, store.data.default_locale);
  const keys = ['title', 'shipping', 'payment', 'pickup', 'flatRate', 'name', 'description', 'price',
    'freeOver', 'save', 'saved', 'error', 'method', 'transfer', 'mobile', 'zelle', 'cash', 'holder',
    'bank', 'account', 'phone', 'email', 'note', 'mercadoPago', 'comingSoon', 'configured'] as const;
  const labels = Object.fromEntries(keys.map((key) => [key, t(`commerce.${key}`)])) as Record<(typeof keys)[number], string>;
  const methodSchema = z.enum(['transferencia', 'pago-movil', 'zelle', 'efectivo']);
  const detailKeys = ['email', 'phone', 'whatsapp', 'address', 'instagram', 'facebook'] as const;
  const details = z.record(z.string(), z.string()).safeParse(store.data.contact);
  const detailLabels = Object.fromEntries(['title', 'save', 'saved', 'error', ...detailKeys]
    .map((key) => [key, t(`storeDetails.${key}`)])) as Record<'title' | 'save' | 'saved' | 'error' | (typeof detailKeys)[number], string>;
  const initialDetails = Object.fromEntries(detailKeys.map((key) => [key,
    key === 'instagram' || key === 'facebook' ? socialLink(store.data.contact, key === 'instagram' ? 'Instagram' : 'Facebook')
      : details.success ? details.data[key] ?? '' : ''])) as Record<(typeof detailKeys)[number], string>;
  const legalLabels = { title: t('legalDrafts.title'), intro: t('legalDrafts.intro'),
    notice: t('legalNotice'),
    create: t('legalDrafts.create'), ready: t('legalDrafts.ready'), saved: t('legalDrafts.saved'),
    error: t('legalDrafts.error'), unsupported: t('legalDrafts.unsupported'), edit: t('legalDrafts.edit'),
    terminos: { title: t('legalDrafts.terminos.title') },
    privacidad: { title: t('legalDrafts.privacidad.title') },
    devoluciones: { title: t('legalDrafts.devoluciones.title') } };
  return <PanelShell context={context} active="settings"><main className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
    <h1 className="text-3xl font-bold">{labels.title}</h1>
    <SettingsForms storeId={storeId} labels={labels} mercadoPagoConnected={Boolean(mercadoPago.data)} shipping={(shipping.data ?? []).filter((item) =>
      item.kind === 'pickup' || item.kind === 'flat_rate').map((item) => ({ ...item,
      kind: item.kind as 'pickup' | 'flat_rate', price: format(item.price_amount), freeOver: format(item.free_over_amount) }))}
      methods={(payments.data ?? []).map((item) => methodSchema.safeParse(item.method_key)).filter((result) => result.success)
        .map((result) => result.data)} />
    <StoreDetails storeId={storeId} labels={detailLabels} initial={initialDetails} />
    <LegalDrafts storeId={storeId} pages={legalPages.data ?? []} labels={legalLabels} />
  </main></PanelShell>;
}
