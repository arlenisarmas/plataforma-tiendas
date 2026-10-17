import { after, NextResponse } from 'next/server';
import { z } from 'zod';
import { CURRENCY_EXPONENTS, toMinor, type CurrencyCode } from '@plataforma/core';
// eslint-disable-next-line boundaries/dependencies -- server-only public export
import { createServiceClient } from '@plataforma/db/server';
import { MercadoPagoProvider, readMercadoPagoNotification, verifyMercadoPagoSignature } from '@plataforma/payments';
import { sendPaymentConfirmedEmail } from '../../../../lib/order-emails';

const currencySchema = z.enum(Object.keys(CURRENCY_EXPONENTS) as [CurrencyCode, ...CurrencyCode[]]);

export async function POST(request: Request) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !url || !key) return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  let notice: Awaited<ReturnType<typeof readMercadoPagoNotification>>;
  try { notice = await readMercadoPagoNotification(request.clone()); }
  catch { return NextResponse.json({ error: 'invalid' }, { status: 400 }); }
  if (!notice.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  if (notice.data.type !== 'payment') return NextResponse.json({ ok: true });
  const dataId = String(notice.data.data.id);
  if (!verifyMercadoPagoSignature(request, secret, dataId) ||
      (new URL(request.url).searchParams.get('data.id') ?? dataId) !== dataId)
    return NextResponse.json({ error: 'signature' }, { status: 401 });

  const client = createServiceClient(url, key);
  const accountId = String(notice.data.user_id);
  const { data: methods } = await client.from('store_payment_methods')
    .select('id,store_id').eq('provider', 'mercadopago').eq('connected_account_id', accountId)
    .eq('is_enabled', true);
  const firstMethod = methods?.[0];
  if (!firstMethod) return NextResponse.json({ error: 'unknown account' }, { status: 404 });
  const secretResult = await client.rpc('get_payment_secret', { p_method_id: firstMethod.id });
  if (secretResult.error || !secretResult.data) return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  let event;
  try { event = await new MercadoPagoProvider(secretResult.data, secret).parseWebhook(request); }
  catch { return NextResponse.json({ error: 'invalid payment' }, { status: 400 }); }
  if (!event || event.collectorId !== accountId) return NextResponse.json({ error: 'invalid payment' }, { status: 400 });

  const { data: payment } = await client.from('payments')
    .select('id,store_id,order_id,payment_method_id,amount,currency,provider').eq('id', event.paymentId).maybeSingle();
  const currency = currencySchema.safeParse(event.currency);
  let amountMatches = false;
  try { amountMatches = currency.success && Number.isSafeInteger(payment?.amount) &&
    BigInt(payment?.amount ?? 0) === toMinor(String(event.amount), currency.data, 'en-US').amount; }
  catch { amountMatches = false; }
  if (!payment || payment.provider !== 'mercadopago' ||
      !methods?.some((method) => method.id === payment.payment_method_id && method.store_id === payment.store_id) ||
      !currency.success || payment.currency !== currency.data || !amountMatches)
    return NextResponse.json({ error: 'invalid payment' }, { status: 400 });

  const stored = await client.from('payment_events').insert({ provider: 'mercadopago',
    provider_event_id: event.providerEventId, store_id: payment.store_id,
    payload: { paymentId: event.paymentId, providerPaymentId: event.providerPaymentId, status: event.status } })
    .select('id').single();
  if (stored.error && stored.error.code !== '23505') return NextResponse.json({ error: 'retry' }, { status: 500 });
  if (stored.error) {
    const previous = await client.from('payment_events').select('processed_at')
      .eq('provider', 'mercadopago').eq('provider_event_id', event.providerEventId).maybeSingle();
    if (previous.data?.processed_at) return NextResponse.json({ ok: true });
  }
  const applied = await client.rpc('apply_payment_status', { p_payment_id: payment.id,
    p_status: event.status, p_provider_payment_id: event.providerPaymentId });
  if (applied.error) return NextResponse.json({ error: 'retry' }, { status: 500 });
  await client.from('payment_events').update({ processed_at: new Date().toISOString(), error: null })
    .eq('provider', 'mercadopago').eq('provider_event_id', event.providerEventId);
  if (event.status === 'approved')
    after(() => sendPaymentConfirmedEmail(client, payment.store_id, payment.order_id));
  return NextResponse.json({ ok: true });
}
