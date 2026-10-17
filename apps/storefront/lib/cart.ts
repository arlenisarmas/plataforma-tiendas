import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

export const cartItemSchema = z.object({ productId: z.uuid(), variantId: z.uuid(), quantity: z.number().int().min(1).max(99) });
export const cartSchema = z.object({ storeId: z.uuid(), items: z.array(cartItemSchema).max(50) });
export type Cart = z.infer<typeof cartSchema>;

export function signCart(input: unknown, secret: string): string {
  if (secret.length < 32) throw new Error('Cart cookie secret is missing or too short');
  const payload = Buffer.from(JSON.stringify(cartSchema.parse(input))).toString('base64url');
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function readCart(raw: string | undefined, storeId: string, secret: string | undefined): Cart {
  const empty: Cart = { storeId, items: [] };
  if (!raw || !secret || secret.length < 32) return empty;
  const [payload, supplied, extra] = raw.split('.');
  if (!payload || !supplied || extra) return empty;
  const expected = createHmac('sha256', secret).update(payload).digest();
  const actual = Buffer.from(supplied, 'base64url');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return empty;
  try {
    const parsed = cartSchema.parse(JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')));
    return parsed.storeId === storeId ? parsed : empty;
  } catch { return empty; }
}

export function putItem(cart: Cart, productId: string, variantId: string, quantity: number): Cart {
  const existing = cart.items.find((item) => item.variantId === variantId);
  const items = existing ? cart.items.map((item) => item.variantId === variantId ?
    { ...item, quantity: Math.min(99, item.quantity + quantity) } : item) :
    [...cart.items, { productId, variantId, quantity }];
  return cartSchema.parse({ ...cart, items });
}
