import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { putItem, readCart, signCart } from './cart';

const secret = randomBytes(32).toString('hex');
const storeId = 'a0000000-0000-4000-8000-000000000001';
const productId = 'a0000000-0000-4000-8000-000000000002';
const variantId = 'a0000000-0000-4000-8000-000000000003';

describe('signed cart', () => {
  it('stores only identifiers and quantities, never a client price', () => {
    const cart = putItem({ storeId, items: [] }, productId, variantId, 2);
    const signed = signCart(cart, secret);
    expect(readCart(signed, storeId, secret)).toEqual(cart);
    expect(Buffer.from(signed.split('.')[0]!, 'base64url').toString()).not.toContain('price');
  });

  it('rejects tampering, other stores, and invalid quantities', () => {
    const signed = signCart({ storeId, items: [{ productId, variantId, quantity: 1 }] }, secret);
    const [payload, signature] = signed.split('.');
    const changed = Buffer.from(JSON.stringify({ storeId, items: [{ productId, variantId, quantity: 1, price: 0 }] })).toString('base64url');
    expect(readCart(`${changed}.${signature}`, storeId, secret).items).toEqual([]);
    expect(readCart(signed, productId, secret).items).toEqual([]);
    expect(() => signCart({ storeId, items: [{ productId, variantId, quantity: 0 }] }, secret)).toThrow();
    expect(readCart(`${payload}.broken`, storeId, secret).items).toEqual([]);
  });
});
