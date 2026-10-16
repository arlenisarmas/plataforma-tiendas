import { z } from 'zod';

export type EmailMessage = { to: string; from: string; subject: string; html: string; idempotencyKey: string };
export interface EmailSender { send(message: EmailMessage): Promise<void> }

const messageSchema = z.object({ to: z.email(), from: z.string().min(3), subject: z.string().min(1),
  html: z.string().min(1), idempotencyKey: z.string().min(1).max(256) });

export function createEmailSender(options: { apiKey?: string; fetcher?: typeof fetch;
  logger?: Pick<Console, 'info' | 'error'> } = {}): EmailSender {
  const logger = options.logger ?? console;
  if (!options.apiKey) return { async send(message) {
    const parsed = messageSchema.parse(message);
    logger.info('Development email', { subject: parsed.subject, idempotencyKey: parsed.idempotencyKey });
  } };
  const fetcher = options.fetcher ?? fetch;
  return { async send(message) {
    const parsed = messageSchema.parse(message);
    const response = await fetcher('https://api.resend.com/emails', { method: 'POST', headers: {
      Authorization: `Bearer ${options.apiKey}`, 'Content-Type': 'application/json',
      'Idempotency-Key': parsed.idempotencyKey }, body: JSON.stringify({ from: parsed.from,
        to: [parsed.to], subject: parsed.subject, html: parsed.html }) });
    if (!response.ok) throw new Error(`Email service returned ${response.status}`);
  } };
}

export async function sendWithRetry(sender: EmailSender, message: EmailMessage, options: {
  attempts?: number; pause?: (milliseconds: number) => Promise<void>; logger?: Pick<Console, 'error'>
} = {}): Promise<boolean> {
  const attempts = options.attempts ?? 3;
  const pause = options.pause ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  for (let index = 0; index < attempts; index++) {
    try { await sender.send(message); return true; }
    catch { if (index + 1 < attempts) await pause(250 * 2 ** index); }
  }
  (options.logger ?? console).error('Email delivery failed', { idempotencyKey: message.idempotencyKey });
  return false;
}
