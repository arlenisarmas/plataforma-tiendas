'use server';

import { createHash, randomBytes } from 'node:crypto';
import { headers } from 'next/headers';
import { z } from 'zod';
import { calculateTotals, CURRENCY_EXPONENTS, MemoryRateLimiter, type CurrencyCode } from '@plataforma/core';
// eslint-disable-next-line boundaries/dependencies -- guest checkout requires the server-only service role
import { createServiceClient } from '@plataforma/db/server';
import { ManualProvider, MercadoPagoProvider, type CheckoutResult } from '@plataforma/payments';
import { currentCart } from './cart-server';

const currencySchema = z.enum(Object.keys(CURRENCY_EXPONENTS) as [CurrencyCode, ...CurrencyCode[]]);
const inputSchema = z.object({ storeId: z.uuid(), email: z.email(), fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(40), shippingMethodId: z.uuid(), paymentMethodId: z.uuid(),
  address: z.object({ line1: z.string().trim().min(3).max(200), city: z.string().trim().min(2).max(100),
    postalCode: z.string().trim().max(20) }).optional() });
type CheckoutError = 'invalid' | 'empty' | 'unavailable' | 'stock' | 'rate' | 'payment';
export type CheckoutResponse = { ok: true; orderId: string; token: string; checkout: CheckoutResult } |
  { ok: false; error: CheckoutError; product?: string };

const limiter = new MemoryRateLimiter();

export async function placeOrder(raw: unknown): Promise<CheckoutResponse> {
  const input = inputSchema.safeParse(raw);
  if (!input.success) return { ok: false, error: 'invalid' };
  const requestHeaders = await headers();
  const ip = requestHeaders.get('x-real-ip') ?? requestHeaders.get('x-forwarded-for')?.split(',')[0] ?? input.data.email;
  if (!limiter.consume(`${input.data.storeId}:${ip}`, 5, 600_000)) return { ok: false, error: 'rate' };
  const cart = await currentCart(input.data.storeId);
  if (!cart.items.length) return { ok: false, error: 'empty' };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL;
  if (!url || !key || !siteUrl) return { ok: false, error: 'unavailable' };
  // Guest checkout has no authenticated RLS identity. Every identifier and total is rechecked here.
  const client = createServiceClient(url, key);
  const { storeId, shippingMethodId, paymentMethodId } = input.data;
  const [storeResult, shippingResult, methodResult, variantResult] = await Promise.all([
    client.from('stores').select('id,status,currency,slug').eq('id', storeId).single(),
    client.from('shipping_methods').select('id,name,kind,price_amount,free_over_amount,is_active')
      .eq('id', shippingMethodId).eq('store_id', storeId).single(),
    client.from('store_payment_methods').select('id,provider,display_name,method_key,instructions,is_enabled,connected_at')
      .eq('id', paymentMethodId).eq('store_id', storeId).single(),
    client.from('product_variants').select('id,product_id,title,sku,price_amount')
      .eq('store_id', storeId).in('id', cart.items.map((item) => item.variantId)),
  ]);
  const store = storeResult.data, shipping = shippingResult.data, method = methodResult.data;
  const currency = currencySchema.safeParse(store?.currency);
  if (!store || store.status !== 'published' || !shipping?.is_active || !method?.is_enabled ||
      (method.provider === 'mercadopago' && !method.connected_at) || !currency.success)
    return { ok: false, error: 'unavailable' };
  if (shipping.kind !== 'pickup' && !input.data.address) return { ok: false, error: 'invalid' };
  const variants = variantResult.data ?? [];
  const { data: products } = await client.from('products').select('id,name,status').eq('store_id', storeId)
    .in('id', cart.items.map((item) => item.productId));
  const lines = cart.items.map((item) => {
    const variant = variants.find((row) => row.id === item.variantId && row.product_id === item.productId);
    const product = products?.find((row) => row.id === item.productId && row.status === 'active');
    return variant && product ? { item, variant, product } : null;
  });
  if (lines.some((line) => !line)) return { ok: false, error: 'unavailable' };
  const ready = lines.filter((line) => line !== null);
  if (ready.some((line) => !Number.isSafeInteger(line.variant.price_amount)) ||
      !Number.isSafeInteger(shipping.price_amount) ||
      (shipping.free_over_amount !== null && !Number.isSafeInteger(shipping.free_over_amount)))
    return { ok: false, error: 'unavailable' };
  const money = (amount: number) => ({ amount: BigInt(amount), currency: currency.data });
  const totals = calculateTotals({ items: ready.map((line) => ({ unitPrice: money(line.variant.price_amount),
    quantity: line.item.quantity })), shippingMethod: { kind: shipping.kind, price: money(shipping.price_amount),
    ...(shipping.free_over_amount ? { freeOver: money(shipping.free_over_amount) } : {}) } });
  const amounts = [totals.subtotal.amount, totals.shipping.amount, totals.total.amount];
  if (amounts.some((amount) => amount > BigInt(Number.MAX_SAFE_INTEGER))) return { ok: false, error: 'unavailable' };

  let orderId: string | undefined;
  let reserved = false;
  let succeeded = false;
  try {
    const customer = await client.from('customers').upsert({ store_id: storeId, email: input.data.email,
      full_name: input.data.fullName, phone: input.data.phone || null }, { onConflict: 'store_id,email' })
      .select('id').single();
    if (customer.error || !customer.data) throw new Error('customer');
    const number = await client.rpc('next_order_number', { p_store_id: storeId });
    if (number.error || !number.data) throw new Error('order number');
    const token = randomBytes(32).toString('base64url');
    const order = await client.from('orders').insert({ store_id: storeId, number: number.data,
      customer_id: customer.data.id, email: input.data.email, currency: currency.data,
      subtotal_amount: Number(totals.subtotal.amount), shipping_amount: Number(totals.shipping.amount),
      total_amount: Number(totals.total.amount), shipping_method_id: shipping.id,
      shipping_snapshot: { name: shipping.name, kind: shipping.kind, price_amount: Number(totals.shipping.amount) },
      shipping_address: input.data.address ?? null,
      access_token_hash: createHash('sha256').update(token).digest('hex') }).select('id').single();
    if (order.error || !order.data) throw new Error('order');
    orderId = order.data.id;
    const items = ready.map((line) => ({ store_id: storeId, order_id: orderId!, product_id: line.product.id,
      variant_id: line.variant.id, product_name: line.product.name, variant_title: line.variant.title,
      sku: line.variant.sku, unit_price_amount: line.variant.price_amount, quantity: line.item.quantity,
      line_total_amount: line.variant.price_amount * line.item.quantity }));
    const inserted = await client.from('order_items').insert(items);
    if (inserted.error) throw new Error('items');
    const reservation = await client.rpc('reserve_stock', { p_order_id: orderId,
      p_ttl: method.provider === 'manual' ? '48 hours' : '30 minutes' });
    if (reservation.error) {
      if (reservation.error.message.includes('STOCK_INSUFICIENTE')) {
        const product = ready.find((line) => reservation.error.details?.includes(line.variant.id));
        return { ok: false, error: 'stock', product: product?.product.name ?? ready[0]?.product.name ?? '' };
      }
      throw new Error('reservation');
    }
    reserved = true;
    const payment = await client.from('payments').insert({ store_id: storeId, order_id: orderId,
      payment_method_id: method.id, provider: method.provider, amount: Number(totals.total.amount),
      currency: currency.data }).select('id').single();
    if (payment.error || !payment.data) throw new Error('payment');
    const orderUrl = `${siteUrl.replace(/\/$/, '')}/pedido/${orderId}?token=${token}&tienda=${store.slug}`;
    let checkout: CheckoutResult;
    if (method.provider === 'manual') {
      const instructions = z.record(z.string(), z.string()).parse(method.instructions);
      checkout = await new ManualProvider({ method: method.display_name, details: instructions,
        receiptRequired: true }).createCheckout({ paymentId: payment.data.id, orderId, currency: currency.data,
        total: totals.total.amount, description: `Pedido ${number.data}`, returnUrl: orderUrl, notificationUrl: '' });
    } else if (method.provider === 'mercadopago') {
      const tokenResult = await client.rpc('get_payment_secret', { p_method_id: method.id });
      if (tokenResult.error || !tokenResult.data) throw new Error('payment token');
      checkout = await new MercadoPagoProvider(tokenResult.data, process.env.MERCADOPAGO_WEBHOOK_SECRET ?? '')
        .createCheckout({ paymentId: payment.data.id, orderId, currency: currency.data,
          total: totals.total.amount, description: `Pedido ${number.data}`, returnUrl: orderUrl,
          notificationUrl: `${siteUrl.replace(/\/$/, '')}/api/payments/mercadopago` });
    } else throw new Error('unsupported payment provider');
    succeeded = true;
    return { ok: true, orderId, token, checkout };
  } catch { return { ok: false, error: 'payment' }; }
  finally {
    if (orderId && !succeeded) {
      const release = reserved ? await client.rpc('release_reservation', { p_order_id: orderId }) : { error: null };
      if (!release.error) await client.from('orders').delete().eq('id', orderId);
    }
  }
}
