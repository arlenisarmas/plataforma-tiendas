import { createEmailSender, sendWithRetry, type EmailSender } from './sender';
import { renderEmail, type EmailTemplateData } from './templates';

type Logger = Pick<Console, 'info' | 'error'>;

/** Sender configured from the environment: Resend when both settings exist, otherwise development. */
export function senderFromEnv(logger: Logger = console): EmailSender {
  const apiKey = process.env.RESEND_API_KEY;
  return createEmailSender(apiKey && process.env.EMAIL_FROM ? { apiKey, logger } : { logger });
}

/**
 * Renders and sends one transactional email. Never throws: a failed email must not
 * break the business action that triggered it. Returns whether it was delivered.
 */
export async function deliverEmail(input: { to: string; data: EmailTemplateData; idempotencyKey: string;
  sender?: EmailSender; logger?: Logger; pause?: (milliseconds: number) => Promise<void> }): Promise<boolean> {
  const logger = input.logger ?? console;
  try {
    const { subject, html } = await renderEmail(input.data);
    return await sendWithRetry(input.sender ?? senderFromEnv(logger), { to: input.to,
      from: process.env.EMAIL_FROM || `${input.data.storeName} <noreply@example.test>`, subject, html,
      idempotencyKey: input.idempotencyKey }, { logger, ...(input.pause ? { pause: input.pause } : {}) });
  } catch {
    logger.error('Email delivery failed', { idempotencyKey: input.idempotencyKey });
    return false;
  }
}
