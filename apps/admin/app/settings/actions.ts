'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { CurrencyCode } from '@plataforma/core';
import { panelContext } from '../../lib/panel-data';
import { parsePayment, parseShipping } from '../../lib/commerce-input';

export async function saveShipping(raw: unknown): Promise<{ error?: 'invalid' | 'save' | 'permission' }> {
  const storeId = z.uuid().safeParse((raw as { storeId?: unknown })?.storeId);
  if (!storeId.success) return { error: 'invalid' };
  const context = await panelContext(storeId.data);
  if (context.selected.id !== storeId.data) return { error: 'permission' };
  const { data: store } = await context.client.from('stores').select('currency,default_locale').eq('id', storeId.data).single();
  if (!store) return { error: 'invalid' };
  let input: ReturnType<typeof parseShipping>;
  try { input = parseShipping(raw, store.currency as CurrencyCode, store.default_locale); }
  catch { return { error: 'invalid' }; }
  const amount = Number(input.priceAmount), threshold = input.freeOverAmount === null ? null : Number(input.freeOverAmount);
  if (!Number.isSafeInteger(amount) || (threshold !== null && !Number.isSafeInteger(threshold))) return { error: 'invalid' };
  const values = { name: input.name, description: input.description || null, kind: input.kind,
    price_amount: amount, free_over_amount: threshold, is_active: input.active };
  const result = input.id ? await context.client.from('shipping_methods').update(values).eq('store_id', storeId.data).eq('id', input.id).select('id').single()
    : await context.client.from('shipping_methods').insert({ ...values, store_id: storeId.data }).select('id').single();
  if (result.error || !result.data) return { error: 'save' };
  revalidatePath('/settings');
  return {};
}

export async function savePayment(raw: unknown): Promise<{ error?: 'invalid' | 'save' | 'permission' }> {
  const storeId = z.uuid().safeParse((raw as { storeId?: unknown })?.storeId);
  if (!storeId.success) return { error: 'invalid' };
  const context = await panelContext(storeId.data);
  if (context.selected.id !== storeId.data) return { error: 'permission' };
  let input: ReturnType<typeof parsePayment>;
  try { input = parsePayment(raw); } catch { return { error: 'invalid' }; }
  const existing = await context.client.from('store_payment_methods').select('id').eq('store_id', storeId.data)
    .eq('provider', 'manual').eq('method_key', input.method).maybeSingle();
  if (existing.error) return { error: 'save' };
  const values = { display_name: input.displayName, instructions: input.fields, is_enabled: true };
  const saved = existing.data ? await context.client.from('store_payment_methods').update(values)
    .eq('id', existing.data.id).eq('store_id', storeId.data) :
    await context.client.from('store_payment_methods').insert({ ...values, store_id: storeId.data,
      provider: 'manual', method_key: input.method });
  if (saved.error) return { error: 'save' };
  revalidatePath('/settings');
  return {};
}
