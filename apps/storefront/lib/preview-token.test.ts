import { describe, expect, it } from 'vitest';
import { createCipheriv, createHash, randomBytes } from 'node:crypto';
import { readPreviewToken } from './preview-token';

const secret = 'a-long-private-preview-secret-for-tests-only';
const payload = { storeId: 'a0000000-0000-4000-8000-000000000001',
  pageId: 'a0000000-0000-4000-8000-000000000002', accessToken: 'test-access-token',
  origin: 'http://localhost:3001', expiresAt: Date.now() + 15 * 60_000 };

function createFixture() {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', createHash('sha256').update(secret).digest(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload)), cipher.final()]);
  return [iv, encrypted, cipher.getAuthTag()].map((part) => part.toString('base64url')).join('.');
}

describe('preview access', () => {
  it('requires an authentic token that has not expired', () => {
    const token = createFixture();
    expect(readPreviewToken(token, secret)?.storeId).toBe(payload.storeId);
    expect(readPreviewToken(`${token[0] === 'A' ? 'B' : 'A'}${token.slice(1)}`, secret)).toBeNull();
    expect(readPreviewToken(token, secret, payload.expiresAt + 1)).toBeNull();
    expect(readPreviewToken(token, undefined)).toBeNull();
  });
});
