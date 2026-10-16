import { describe, expect, it, vi } from 'vitest';

const { deliver } = vi.hoisted(() => ({ deliver: vi.fn() }));
vi.mock('@plataforma/emails', () => ({ deliverEmail: deliver }));

import { sendOrderUpdateEmail } from './order-emails';

const storeId = '11111111-1111-4111-8111-111111111111';
const orderId = '66666666-6666-4666-8666-666666666666';
function client(row: unknown) {
  const single = vi.fn(async () => ({ data: row }));
  const eq = (): unknown => ({ eq, single });
  return { from: vi.fn(() => ({ select: () => ({ eq }) })) } as never;
}
const row = { number: 1001, email: 'buyer@example.test', locale: 'es-AR', stores: { name: 'Che Peludos' } };

describe('order update emails', () => {
  it('confirms the payment', async () => {
    deliver.mockReset();
    await sendOrderUpdateEmail(client(row), storeId, orderId, 'paid');
    expect(deliver).toHaveBeenCalledWith(expect.objectContaining({ to: 'buyer@example.test',
      idempotencyKey: `order/${orderId}/paid`, data: expect.objectContaining({ kind: 'paymentConfirmed' }) }));
  });
  it('announces pickup and shipment with the right template', async () => {
    deliver.mockReset();
    await sendOrderUpdateEmail(client(row), storeId, orderId, 'ready_for_pickup');
    await sendOrderUpdateEmail(client(row), storeId, orderId, 'shipped');
    expect(deliver.mock.calls.map(([call]) => [call.data.kind, call.data.pickup]))
      .toEqual([['orderReady', true], ['orderReady', false]]);
  });
  it('never throws when the email fails', async () => {
    deliver.mockReset().mockRejectedValue(new Error('down'));
    await expect(sendOrderUpdateEmail(client(row), storeId, orderId, 'paid')).resolves.toBeUndefined();
  });
});
