'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { panelContext } from '../../lib/panel-data';
import { parseProductInput } from '../../lib/product-input';
import { slugify, type CurrencyCode } from '@plataforma/core';

const categorySchema = z.object({ storeId: z.uuid(), name: z.string().trim().min(1).max(80),
  parentId: z.uuid().nullable(), position: z.number().int().min(0) });

export async function createProduct(raw: unknown): Promise<{ productId?: string; error?: string }> {
  const storeId = z.uuid().safeParse((raw as { storeId?: unknown })?.storeId);
  if (!storeId.success) return { error: 'invalid' };
  const context = await panelContext(storeId.data);
  if (context.selected.id !== storeId.data) return { error: 'permission' };
  const { client } = context;
  const { data: store } = await client.from('stores').select('currency,default_locale').eq('id', storeId.data).single();
  if (!store) return { error: 'invalid' };
  let input: ReturnType<typeof parseProductInput>;
  try { input = parseProductInput(raw, store.currency as CurrencyCode, store.default_locale); }
  catch { return { error: 'invalid' }; }
  if (input.categoryId) {
    const { data } = await client.from('categories').select('id').eq('store_id', storeId.data).eq('id', input.categoryId).maybeSingle();
    if (!data) return { error: 'invalid' };
  }
  if (input.assetId) {
    const { data } = await client.from('media_assets').select('id').eq('store_id', storeId.data).eq('id', input.assetId).maybeSingle();
    if (!data) return { error: 'invalid' };
  }
  const { data: product, error } = await client.from('products').insert({ store_id: storeId.data,
    name: input.name, slug: input.slug, description: input.description ?? null,
    category_id: input.categoryId ?? null, status: input.status }).select('id').single();
  if (error || !product) return { error: 'save' };
  for (const [index, variant] of input.variants.entries()) {
    const { data: saved, error: variantError } = await client.from('product_variants').insert({
      store_id: storeId.data, product_id: product.id, title: variant.title, options: variant.options,
      price_amount: variant.priceAmount, compare_at_amount: variant.compareAtAmount,
      cost_amount: variant.costAmount, sku: variant.sku || null, weight_grams: variant.weightGrams ?? null,
      position: index, is_default: index === 0,
    }).select('id').single();
    if (variantError || !saved) { await client.from('products').delete().eq('id', product.id); return { error: 'save' }; }
    if (variant.stock > 0) {
      const { error: stockError } = await client.rpc('adjust_stock', { p_variant_id: saved.id,
        p_delta: variant.stock, p_reason: 'initial' });
      if (stockError) { await client.from('products').delete().eq('id', product.id); return { error: 'save' }; }
    }
  }
  if (input.assetId) {
    const { error: imageError } = await client.from('product_images').insert({ store_id: storeId.data,
      product_id: product.id, asset_id: input.assetId, position: 0 });
    if (imageError) { await client.from('products').delete().eq('id', product.id); return { error: 'save' }; }
  }
  revalidatePath('/products');
  return { productId: product.id };
}

export async function createCategory(raw: unknown) {
  const input = categorySchema.safeParse(raw);
  if (!input.success) return { error: 'invalid' as const };
  const context = await panelContext(input.data.storeId);
  if (context.selected.id !== input.data.storeId) return { error: 'permission' as const };
  if (input.data.parentId) {
    const { data: parent } = await context.client.from('categories').select('id,parent_id').eq('store_id', input.data.storeId)
      .eq('id', input.data.parentId).maybeSingle();
    if (!parent || parent.parent_id) return { error: 'invalid' as const };
  }
  const { error } = await context.client.from('categories').insert({ store_id: input.data.storeId,
    name: input.data.name, slug: slugify(input.data.name), parent_id: input.data.parentId,
    position: input.data.position });
  if (error) return { error: 'save' as const };
  revalidatePath('/products/categories');
  return {};
}

export async function adjustProductStock(raw: unknown) {
  const input = z.object({ storeId: z.uuid(), variantId: z.uuid(), delta: z.number().int().refine((n) => n !== 0),
    note: z.string().max(300).optional() }).safeParse(raw);
  if (!input.success) return { error: 'invalid' as const };
  const context = await panelContext(input.data.storeId);
  if (context.selected.id !== input.data.storeId) return { error: 'permission' as const };
  const { data: variant } = await context.client.from('product_variants').select('id').eq('store_id', input.data.storeId)
    .eq('id', input.data.variantId).maybeSingle();
  if (!variant) return { error: 'invalid' as const };
  const { error } = await context.client.rpc('adjust_stock', { p_variant_id: input.data.variantId,
    p_delta: input.data.delta, p_reason: input.data.delta > 0 ? 'restock' : 'adjustment',
    ...(input.data.note ? { p_note: input.data.note } : {}) });
  if (error) return { error: 'save' as const };
  revalidatePath('/products');
  return {};
}

export async function reorderCategories(raw: unknown) {
  const input = z.object({ storeId: z.uuid(), ids: z.array(z.uuid()).max(100) }).safeParse(raw);
  if (!input.success || new Set(input.data.ids).size !== input.data.ids.length) return { error: 'invalid' as const };
  const context = await panelContext(input.data.storeId);
  if (context.selected.id !== input.data.storeId) return { error: 'permission' as const };
  const { data } = await context.client.from('categories').select('id').eq('store_id', input.data.storeId);
  if (!data || data.length !== input.data.ids.length || data.some((row) => !input.data.ids.includes(row.id))) return { error: 'invalid' as const };
  for (const [position, id] of input.data.ids.entries()) {
    const { error } = await context.client.from('categories').update({ position }).eq('store_id', input.data.storeId).eq('id', id);
    if (error) return { error: 'save' as const };
  }
  revalidatePath('/products/categories');
  return {};
}
