import { describe, expect, it, vi } from 'vitest';
import { createEmailSender, sendWithRetry, type EmailMessage } from './sender';

const message: EmailMessage = { to: 'buyer@example.test', from: 'Tienda <noreply@example.test>',
  subject: 'Pedido', html: '<p>Listo</p>', idempotencyKey: 'order/1' };

describe('email sender', () => {
  it('uses development sender when there is no key', async () => {
    const info = vi.fn();
    await createEmailSender({ logger: { info, error: vi.fn() } }).send(message);
    expect(info).toHaveBeenCalledOnce();
    expect(JSON.stringify(info.mock.calls)).not.toContain(message.to);
  });
  it('sends idempotently through Resend', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true });
    await createEmailSender({ apiKey: 'test-only', fetcher }).send(message);
    expect(fetcher).toHaveBeenCalledWith('https://api.resend.com/emails', expect.objectContaining({
      headers: expect.objectContaining({ 'Idempotency-Key': 'order/1' }) }));
  });
  it('retries failures and records the final failure', async () => {
    const sender = { send: vi.fn().mockRejectedValue(new Error('network')) };
    const error = vi.fn();
    expect(await sendWithRetry(sender, message, { attempts: 3, pause: async () => {}, logger: { error } })).toBe(false);
    expect(sender.send).toHaveBeenCalledTimes(3);
    expect(error).toHaveBeenCalledOnce();
  });
});
