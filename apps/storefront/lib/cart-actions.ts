'use server';

import { cookies } from 'next/headers';
import { z } from 'zod';
import { CART_COOKIE, cartView, currentCart } from './cart-server';
import { putItem, signCart } from './cart';
import { readStorefront, variantSchema } from './storefront-data';

const addSchema = z.object({ storeId: z.uuid(), productId: z.uuid(), variantId: z.uuid() });
const quantitySchema = addSchema.pick({ storeId: true, variantId: true }).extend({ quantity: z.number().int().min(0).max(99) });

async function saveCart(storeId: string, items: Awaited<ReturnType<typeof currentCart>>['items']) {
  const secret = process.env.CART_COOKIE_SECRET;
  if (!secret || secret.length < 32) {
    // Configuration problem, not a buyer problem: leave a trace for whoever runs the store.
    console.error('Cart unavailable: CART_COOKIE_SECRET is missing or shorter than 32 characters');
    return false;
  }
  const jar = await cookies();
  jar.set(CART_COOKIE, signCart({ storeId, items }, secret), { httpOnly: true, sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 30 });
  return true;
}

export async function addCartItem(raw: unknown): Promise<{ error?: 'invalid' | 'unavailable' | 'config' | 'full' }> {
  const parsed = addSchema.safeParse(raw);
  if (!parsed.success) return { error: 'invalid' };
  const { storeId, productId, variantId } = parsed.data;
  const variant = (await readStorefront('variants', variantSchema, { store_id: `eq.${storeId}`,
    product_id: `eq.${productId}`, id: `eq.${variantId}`, limit: '1' }, [], true))[0];
  if (!variant?.is_available) {
    console.error('Cart add rejected: variant unavailable', { storeId, variantId });
    return { error: 'unavailable' };
  }
  const cart = await currentCart(storeId);
  if (cart.items.length >= 50 && !cart.items.some((item) => item.variantId === variantId)) return { error: 'full' };
  const next = putItem(cart, productId, variantId, 1);
  return await saveCart(storeId, next.items) ? {} : { error: 'config' };
}

export async function setCartQuantity(raw: unknown): Promise<{ error?: 'invalid' | 'config' }> {
  const parsed = quantitySchema.safeParse(raw);
  if (!parsed.success) return { error: 'invalid' };
  const { storeId, variantId, quantity } = parsed.data;
  const current = await cartView(storeId);
  const items = current.lines.map((line) => ({ productId: line.productId, variantId: line.variantId,
    quantity: line.variantId === variantId ? quantity : line.quantity })).filter((line) => line.quantity > 0);
  return await saveCart(storeId, items) ? {} : { error: 'config' };
}

export async function reconcileCart(raw: unknown): Promise<void> {
  const parsed = z.uuid().safeParse(raw);
  if (!parsed.success) return;
  const current = await cartView(parsed.data);
  if (current.changed) await saveCart(parsed.data, current.lines.map(({ productId, variantId, quantity }) =>
    ({ productId, variantId, quantity })));
}
