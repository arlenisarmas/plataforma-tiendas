import { describe, expect, it, vi } from 'vitest';

const { deliver } = vi.hoisted(() => ({ deliver: vi.fn() }));
vi.mock('@plataforma/emails', () => ({ deliverEmail: deliver }));

import { instructionsText, sendNewOrderEmails, sendPaymentConfirmedEmail } from './order-emails';

const storeId = '11111111-1111-4111-8111-111111111111';
const orderId = '66666666-6666-4666-8666-666666666666';
function client(row: unknown) {
  const single = vi.fn(async () => ({ data: row }));
  const eq = (): unknown => ({ eq, single });
  return { from: vi.fn(() => ({ select: () => ({ eq }) })) } as never;
}
const order = { storeId, orderId, orderNumber: 1001, buyerEmail: 'buyer@example.test', buyerName: 'Ana',
  orderUrl: 'https://example.test/pedido/1', paymentInstructions: 'alias: demo' };

describe('order emails', () => {
  it('sends the buyer confirmation and the owner notice in the store language', async () => {
    deliver.mockReset();
    await sendNewOrderEmails(client({ name: 'Che Peludos', default_locale: 'es-AR',
      contact: { email: 'hola@example.test', whatsapp: '+54' } }), order);
    expect(deliver).toHaveBeenCalledWith(expect.objectContaining({ to: 'buyer@example.test',
      idempotencyKey: `order/${orderId}/confirmation`,
      data: expect.objectContaining({ kind: 'orderConfirmation', paymentInstructions: 'alias: demo' }) }));
    expect(deliver).toHaveBeenCalledWith(expect.objectContaining({ to: 'hola@example.test',
      data: expect.objectContaining({ kind: 'newOrder', orderNumber: 1001 }) }));
  });
  it('skips the owner notice when the store has no contact email', async () => {
    deliver.mockReset();
    await sendNewOrderEmails(client({ name: 'Tienda', default_locale: 'xx', contact: {} }), order);
    expect(deliver).toHaveBeenCalledOnce();
  });
  it('never throws', async () => {
    deliver.mockReset().mockRejectedValue(new Error('down'));
    await expect(sendNewOrderEmails(client({ name: 'T', default_locale: 'es-419', contact: null }), order))
      .resolves.toBeUndefined();
    await expect(sendPaymentConfirmedEmail(client({ number: 1, email: 'b@example.test', locale: 'en',
      stores: { name: 'T' } }), storeId, orderId)).resolves.toBeUndefined();
  });
  it('formats manual payment instructions', () => {
    expect(instructionsText({ alias: 'demo', titular: 'Ana' })).toBe('alias: demo\ntitular: Ana');
  });
});
