import { createHmac } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { ManualProvider } from './manual';
import { MercadoPagoProvider } from './mercadopago';

const paymentId = '11111111-1111-4111-8111-111111111111';
function notification(secret: string, valid = true) {
  const dataId = '789';
  const digest = createHmac('sha256', valid ? secret : 'other')
    .update(`id:${dataId};request-id:req-1;ts:1704908010;`).digest('hex');
  return new Request(`https://example.com/api/payments/mercadopago?data.id=${dataId}`, {
    method: 'POST', headers: { 'x-request-id': 'req-1', 'x-signature': `ts=1704908010,v1=${digest}` },
    body: JSON.stringify({ type: 'payment', user_id: 42, data: { id: dataId } }),
  });
}

describe('MercadoPagoProvider', () => {
  it('rejects an invalid signature before fetching a payment', async () => {
    const fetcher = vi.fn();
    const provider = new MercadoPagoProvider('server-only-value', 'signature-secret', fetcher);
    await expect(provider.parseWebhook(notification('signature-secret', false))).rejects.toThrow('signature');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('normalizes a verified payment and retains its amount and account for server checks', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 789,
      external_reference: paymentId, status: 'approved', transaction_amount: 123.45,
      currency_id: 'ARS', collector_id: 42 }) });
    const provider = new MercadoPagoProvider('server-only-value', 'signature-secret', fetcher);
    expect(await provider.parseWebhook(notification('signature-secret'))).toEqual({
      providerEventId: '789:approved', providerPaymentId: '789', paymentId, status: 'approved',
      amount: 123.45, currency: 'ARS', collectorId: '42',
    });
    expect(fetcher).toHaveBeenCalledOnce();
  });
});

describe('ManualProvider', () => {
  it('returns configured instructions and does not accept webhooks', async () => {
    const provider = new ManualProvider({ method: 'transferencia', details: { alias: 'ejemplo' }, receiptRequired: true });
    expect(await provider.createCheckout({ paymentId, orderId: paymentId, currency: 'ARS', total: 100n,
      description: 'Pedido', returnUrl: 'https://example.com', notificationUrl: 'https://example.com' }))
      .toEqual({ kind: 'instructions', instructions: { method: 'transferencia', details: { alias: 'ejemplo' }, receiptRequired: true } });
    expect(await provider.parseWebhook(notification('signature-secret'))).toBeNull();
  });
});
