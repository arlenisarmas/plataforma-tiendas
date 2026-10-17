import { createDecipheriv, createHash } from 'node:crypto';
import { z } from 'zod';

const payloadSchema = z.object({ storeId: z.uuid(), pageId: z.uuid(), accessToken: z.string().min(10),
  origin: z.url(), expiresAt: z.number().int().positive() });

export function readPreviewToken(token: string, secret: string | undefined, now = Date.now()) {
  if (!secret || secret.length < 32) return null;
  const parts = token.split('.');
  if (parts.length !== 3 || parts.some((part) => !/^[A-Za-z0-9_-]+$/.test(part))) return null;
  try {
    const [iv, encrypted, tag] = parts.map((part) => Buffer.from(part, 'base64url'));
    if (!iv || !encrypted || !tag || iv.length !== 12 || tag.length !== 16) return null;
    const decipher = createDecipheriv('aes-256-gcm', createHash('sha256').update(secret).digest(), iv);
    decipher.setAuthTag(tag);
    const payload = payloadSchema.parse(JSON.parse(Buffer.concat([decipher.update(encrypted), decipher.final()]).toString()));
    // Tolera un minuto de diferencia de reloj entre el panel y la tienda.
    return payload.expiresAt > now && payload.expiresAt <= now + 16 * 60_000 ? payload : null;
  } catch { return null; }
}
