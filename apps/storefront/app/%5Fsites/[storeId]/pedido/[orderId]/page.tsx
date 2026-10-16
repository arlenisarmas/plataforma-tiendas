import { notFound } from 'next/navigation';
import { z } from 'zod';
import { formatMoney } from '@plataforma/core';
// eslint-disable-next-line boundaries/dependencies -- server-only public export
import { createServiceClient } from '@plataforma/db/server';
import { isLocale, messages } from '@plataforma/i18n';
import { catalogStore } from '../../../../../lib/catalog-ui';
import { ReceiptUpload } from './receipt-upload';

const orderSchema = z.object({ number: z.number(), status: z.string(), total_amount: z.number(),
  payments: z.array(z.object({ provider: z.string(), status: z.string(), display_name: z.string().nullable(),
    instructions: z.record(z.string(), z.unknown()).nullable() })) });

export default async function OrderPage({ params, searchParams }: { params: Promise<{ storeId: string; orderId: string }>;
  searchParams: Promise<{ token?: string }> }) {
  const [{ storeId, orderId }, { token }] = await Promise.all([params, searchParams]);
  const store = await catalogStore(storeId);
  if (!store) notFound();
  const labels = messages[isLocale(store.default_locale) ? store.default_locale : 'es-419'].storefront.order;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing server Supabase settings');
  const client = createServiceClient(url, key);
  if (!z.uuid().safeParse(orderId).success || !token) return <main className="mx-auto max-w-xl p-4">
    <h1 className="text-3xl font-bold">{labels.title}</h1><p role="alert" className="mt-4">{labels.missing}</p></main>;
  const result = await client.rpc('get_order_for_buyer', { p_order_id: orderId, p_token: token });
  const parsed = orderSchema.safeParse(result.data);
  if (result.error || !parsed.success) return <main className="mx-auto max-w-xl p-4">
    <h1 className="text-3xl font-bold">{labels.title}</h1><p role="alert" className="mt-4">{labels.missing}</p></main>;
  const order = parsed.data;
  const manual = order.payments.find((payment) => payment.provider === 'manual');
  const { data: payment } = manual ? await client.from('payments').select('id,status,receipt_asset_id')
    .eq('order_id', orderId).eq('provider', 'manual').order('created_at', { ascending: false }).limit(1).maybeSingle()
    : { data: null };
  return <main className="mx-auto max-w-xl space-y-5 p-4"><h1 className="text-3xl font-bold">{labels.title} #{order.number}</h1>
    <p role="status">{order.status === 'paid' ? labels.paid : payment?.status === 'in_review' ? labels.inReview : labels.pending}</p>
    <p className="text-xl font-semibold">{formatMoney({ amount: BigInt(order.total_amount), currency: store.currency }, store.default_locale)}</p>
    {manual && <section className="space-y-3 rounded border p-4"><h2 className="text-xl font-semibold">{labels.instructions}</h2>
      <p>{manual.display_name}</p><dl>{Object.entries(manual.instructions ?? {}).map(([name, value]) =>
        <div key={name} className="break-words py-1"><dt className="font-semibold">{name}</dt>
          <dd>{typeof value === 'string' ? value : ''}</dd></div>)}</dl>
      {payment && !payment.receipt_asset_id && payment.status === 'pending' &&
        <ReceiptUpload paymentId={payment.id} orderToken={token} labels={labels} />}
    </section>}
  </main>;
}
