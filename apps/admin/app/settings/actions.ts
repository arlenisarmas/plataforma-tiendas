'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { CurrencyCode } from '@plataforma/core';
import { panelContext } from '../../lib/panel-data';
import { parsePayment, parseShipping } from '../../lib/commerce-input';
import { adminLocale, adminText } from '../../lib/locale';
import { legalDraftPages, legalSlugs } from '../../lib/legal-drafts';
import { contactFromDetails, detailsSchema } from '../../lib/store-details-data';

export async function saveStoreDetails(raw: unknown): Promise<{ error?: 'invalid' | 'save' | 'permission' }> {
  const input = detailsSchema.safeParse(raw);
  if (!input.success) return { error: 'invalid' };
  const context = await panelContext(input.data.storeId);
  if (context.selected.id !== input.data.storeId) return { error: 'permission' };
  const { data: store, error: readError } = await context.client.from('stores').select('contact')
    .eq('id', input.data.storeId).single();
  if (readError || !store) return { error: 'save' };
  const contact = contactFromDetails(input.data, store.contact);
  const { error } = await context.client.from('stores').update({ contact }).eq('id', input.data.storeId);
  if (error) return { error: 'save' };
  revalidatePath('/settings');
  return {};
}

export async function createLegalDrafts(raw: unknown): Promise<{ error?: 'invalid' | 'permission' | 'unsupported' | 'save' }> {
  const input = z.object({ storeId: z.uuid() }).safeParse(raw);
  if (!input.success) return { error: 'invalid' };
  const context = await panelContext(input.data.storeId);
  if (context.selected.id !== input.data.storeId) return { error: 'permission' };
  const [store, pages, t, locale] = await Promise.all([
    context.client.from('stores').select('country_code').eq('id', input.data.storeId).single(),
    context.client.from('pages').select('slug,kind').eq('store_id', input.data.storeId).in('slug', [...legalSlugs]),
    adminText(), adminLocale(),
  ]);
  if (store.error || pages.error || !store.data) return { error: 'save' };
  const supported = z.enum(['AR', 'CL', 'CO', 'ES', 'MX', 'PE', 'US', 'UY', 'VE']).safeParse(store.data.country_code);
  if (!supported.success) return { error: 'unsupported' };
  if (pages.data?.some((page) => page.kind !== 'legal')) return { error: 'save' };
  const country = new Intl.DisplayNames([locale], { type: 'region' }).of(supported.data) ?? supported.data;
  const copy = Object.fromEntries(legalSlugs.map((slug) => [slug, {
    title: t(`legalDrafts.${slug}.title`),
    body: `${t(`legalDrafts.${slug}.body`, { country })}\n${t(`legalReviewFields.${slug}`, { country })}`,
  }])) as Parameters<typeof legalDraftPages>[0];
  const existing = new Set((pages.data ?? []).map((page) => page.slug));
  const missing = legalDraftPages(copy).filter((page) => !existing.has(page.slug));
  if (missing.length) {
    const { error } = await context.client.from('pages').insert(missing.map((page) => ({ ...page, store_id: input.data.storeId })));
    if (error) return { error: 'save' };
  }
  revalidatePath('/settings');
  revalidatePath('/page/pages');
  return {};
}

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
