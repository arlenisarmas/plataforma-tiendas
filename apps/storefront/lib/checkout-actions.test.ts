import { beforeEach, describe, expect, it, vi } from 'vitest';

const { service, cart, emails } = vi.hoisted(() => ({ service: vi.fn(), cart: vi.fn(), emails: vi.fn() }));
vi.mock('@plataforma/db/server', () => ({ createServiceClient: service }));
vi.mock('./cart-server', () => ({ currentCart: cart }));
vi.mock('next/headers', () => ({ headers: async () => ({ get: () => 'test-visitor' }) }));
vi.mock('next/server', () => ({ after: (task: () => unknown) => { void task(); } }));
vi.mock('./order-emails', async (original) => ({
  ...await original<typeof import('./order-emails')>(), sendNewOrderEmails: emails }));

import { placeOrder } from './checkout-actions';

const storeId = '11111111-1111-4111-8111-111111111111';
const productId = '22222222-2222-4222-8222-222222222222';
const variantId = '33333333-3333-4333-8333-333333333333';
const shippingId = '44444444-4444-4444-8444-444444444444';
const methodId = '55555555-5555-4555-8555-555555555555';
const orderId = '66666666-6666-4666-8666-666666666666';
const input = { storeId, email: 'buyer@example.test', fullName: 'Buyer Example', phone: '',
  shippingMethodId: shippingId, paymentMethodId: methodId };

function fakeClient(stockError = false) {
  const orderInsert = vi.fn(() => ({ select: () => ({ single: async () => ({ data: { id: orderId } }) }) }));
  const orderDelete = vi.fn().mockResolvedValue({ error: null });
  const rpc = vi.fn(async (name: string) => name === 'next_order_number' ? { data: 1001 } :
    name === 'reserve_stock' && stockError ? { error: { message: 'STOCK_INSUFICIENTE', details: variantId } } :
      { data: null, error: null });
  const client = { rpc, from: (table: string) => {
    if (table === 'stores') return { select: () => ({ eq: () => ({ single: async () => ({ data: {
      id: storeId, status: 'published', currency: 'ARS', slug: 'example',
    } }) }) }) };
    if (table === 'shipping_methods') return { select: () => ({ eq: () => ({ eq: () => ({
      single: async () => ({ data: { id: shippingId, name: 'Pickup', kind: 'pickup',
        price_amount: 0, free_over_amount: null, is_active: true } }),
    }) }) }) };
    if (table === 'store_payment_methods') return { select: () => ({ eq: () => ({ eq: () => ({
      single: async () => ({ data: { id: methodId, provider: 'manual', display_name: 'Transfer',
        instructions: { alias: 'example' }, is_enabled: true, connected_at: null } }),
    }) }) }) };
    if (table === 'product_variants') return { select: () => ({ eq: () => ({ in: async () => ({ data: [{
      id: variantId, product_id: productId, title: 'Small', sku: 'S', price_amount: 1250,
    }] }) }) }) };
    if (table === 'products') return { select: () => ({ eq: () => ({ in: async () => ({ data: [{
      id: productId, name: 'Blue shirt', status: 'active',
    }] }) }) }) };
    if (table === 'customers') return { upsert: () => ({ select: () => ({ single: async () => ({
      data: { id: '77777777-7777-4777-8777-777777777777' },
    }) }) }) };
    if (table === 'orders') return { insert: orderInsert, delete: () => ({ eq: orderDelete }) };
    if (table === 'order_items') return { insert: async () => ({ error: null }) };
    if (table === 'payments') return { insert: () => ({ select: () => ({ single: async () => ({ data: {
      id: '88888888-8888-4888-8888-888888888888',
    } }) }) }) };
    throw new Error(`Unexpected table: ${table}`);
  } };
  return { client, rpc, orderInsert, orderDelete };
}

describe('guest checkout', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-only';
    process.env.NEXT_PUBLIC_STOREFRONT_URL = 'https://example.test';
    emails.mockReset();
    cart.mockResolvedValue({ storeId, items: [{ productId, variantId, quantity: 2 }] });
  });

  it('recalculates the order from database prices before accepting manual payment', async () => {
    const fake = fakeClient(); service.mockReturnValue(fake.client);
    const result = await placeOrder(input);
    expect(result.ok).toBe(true);
    expect(fake.orderInsert).toHaveBeenCalledWith(expect.objectContaining({ total_amount: 2500 }));
    expect(fake.rpc).toHaveBeenCalledWith('reserve_stock', { p_order_id: orderId, p_ttl: '48 hours' });
    expect(emails).toHaveBeenCalledWith(fake.client, expect.objectContaining({ orderId, orderNumber: 1001,
      buyerEmail: 'buyer@example.test', paymentInstructions: 'alias: example' }));
  });

  it('keeps the order when the emails fail', async () => {
    const fake = fakeClient(); service.mockReturnValue(fake.client);
    emails.mockRejectedValueOnce(new Error('email down'));
    expect((await placeOrder(input)).ok).toBe(true);
    expect(fake.orderDelete).not.toHaveBeenCalled();
  });

  it('names the unavailable product and removes an unreserved order', async () => {
    const fake = fakeClient(true); service.mockReturnValue(fake.client);
    expect(await placeOrder(input)).toEqual({ ok: false, error: 'stock', product: 'Blue shirt' });
    expect(fake.orderDelete).toHaveBeenCalledWith('id', orderId);
    expect(fake.rpc).not.toHaveBeenCalledWith('release_reservation', expect.anything());
    expect(emails).not.toHaveBeenCalled();
  });
});
