import { describe, expect, it, vi } from 'vitest';
import { deliverEmail } from './deliver';
import { sampleCopy } from './sample-copy';

const data = { kind: 'newOrder' as const, copy: sampleCopy, storeName: 'Che Peludos', orderNumber: 1001 };

describe('deliverEmail', () => {
  it('renders the template and sends it with the idempotency key', async () => {
    const sender = { send: vi.fn().mockResolvedValue(undefined) };
    expect(await deliverEmail({ to: 'owner@example.test', data, idempotencyKey: 'order/1/new', sender })).toBe(true);
    expect(sender.send).toHaveBeenCalledWith(expect.objectContaining({ to: 'owner@example.test',
      subject: 'Nuevo pedido #1001 en Che Peludos', idempotencyKey: 'order/1/new' }));
  });
  it('never throws when delivery fails', async () => {
    const sender = { send: vi.fn().mockRejectedValue(new Error('down')) };
    const logger = { info: vi.fn(), error: vi.fn() };
    await expect(deliverEmail({ to: 'owner@example.test', data, idempotencyKey: 'k', sender, logger,
      pause: async () => {} })).resolves.toBe(false);
    expect(logger.error).toHaveBeenCalled();
  });
  it('never throws on an invalid recipient', async () => {
    const logger = { info: vi.fn(), error: vi.fn() };
    await expect(deliverEmail({ to: 'not-an-email', data, idempotencyKey: 'k', logger,
      pause: async () => {} })).resolves.toBe(false);
  });
});
