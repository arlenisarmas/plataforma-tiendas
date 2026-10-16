import { createCipheriv, createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';

export const previewPayloadSchema = z.object({ storeId: z.uuid(), pageId: z.uuid(), accessToken: z.string().min(10),
  origin: z.url(), expiresAt: z.number().int().positive() });

export function createPreviewToken(input: z.input<typeof previewPayloadSchema>, secret: string): string {
  if (secret.length < 32) throw new Error('PREVIEW_SECRET must be at least 32 characters');
  const payload = previewPayloadSchema.parse(input);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', createHash('sha256').update(secret).digest(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);
  return [iv, encrypted, cipher.getAuthTag()].map((part) => part.toString('base64url')).join('.');
}
