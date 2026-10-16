import { beforeEach, describe, expect, it, vi } from 'vitest';

const { service, signature, parseWebhook } = vi.hoisted(() => ({
  service: vi.fn(), signature: vi.fn(), parseWebhook: vi.fn(),
}));
vi.mock('@plataforma/db/server', () => ({ createServiceClient: service }));
vi.mock('@plataforma/payments', () => ({
  readMercadoPagoNotification: async () => ({ success: true,
    data: { type: 'payment', user_id: 42, data: { id: '789' } } }),
  verifyMercadoPagoSignature: signature,
  MercadoPagoProvider: class { parseWebhook = parseWebhook; },
}));

import { POST } from './route';

const paymentId = '11111111-1111-4111-8111-111111111111';
const methodId = '22222222-2222-4222-8222-222222222222';
function request() {
  return new Request('https://example.com/api/payments/mercadopago?data.id=789',
    { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } });
}

describe('Mercado Pago webhook', () => {
  beforeEach(() => {
    process.env.MERCADOPAGO_WEBHOOK_SECRET = 'test-only';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-only';
    service.mockReset(); signature.mockReset(); parseWebhook.mockReset();
  });

  it('rejects an invalid signature without touching the database', async () => {
    signature.mockReturnValue(false);
    expect((await POST(request())).status).toBe(401);
    expect(service).not.toHaveBeenCalled();
  });

  it('acknowledges a processed duplicate without applying payment effects again', async () => {
    signature.mockReturnValue(true);
    parseWebhook.mockResolvedValue({ providerEventId: '789:approved', providerPaymentId: '789',
      paymentId, status: 'approved', amount: 100, currency: 'ARS', collectorId: '42' });
    const rpc = vi.fn().mockResolvedValue({ data: 'test-only', error: null });
    const from = vi.fn((table: string) => {
      if (table === 'store_payment_methods') return { select: () => ({ eq: () => ({ eq: () => ({
        eq: () => Promise.resolve({ data: [{ id: methodId, store_id: paymentId }] }),
      }) }) }) };
      if (table === 'payments') return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: {
        id: paymentId, store_id: paymentId, payment_method_id: methodId, amount: 10000,
        currency: 'ARS', provider: 'mercadopago',
      } }) }) }) };
      if (table === 'payment_events') return {
        insert: () => ({ select: () => ({ single: async () => ({ error: { code: '23505' } }) }) }),
        select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: {
          processed_at: '2026-10-16T00:00:00Z',
        } }) }) }) }),
      };
      throw new Error(`Unexpected table: ${table}`);
    });
    service.mockReturnValue({ rpc, from });
    expect((await POST(request())).status).toBe(200);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).not.toHaveBeenCalledWith('apply_payment_status', expect.anything());
  });
});
