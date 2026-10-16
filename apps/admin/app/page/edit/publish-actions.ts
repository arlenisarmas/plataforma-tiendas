'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { panelContext } from '../../../lib/panel-data';
import { themeSchema } from '@plataforma/blocks';

const pageInput = z.object({ storeId: z.uuid(), pageId: z.uuid() });

async function invalidateStorefront(storeId: string, pageId?: string) {
  const base = process.env.NEXT_PUBLIC_STOREFRONT_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!base || !secret) return false;
  const response = await fetch(`${base.replace(/\/$/, '')}/api/revalidate`, {
    method: 'POST', cache: 'no-store', headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ storeId, pageId }),
  });
  return response.ok;
}

export async function publishPage(raw: unknown): Promise<{ error?: 'invalid' | 'save' | 'cache' | 'permission' }> {
  const input = pageInput.extend({ note: z.string().trim().max(200).optional() }).safeParse(raw);
  if (!input.success) return { error: 'invalid' };
  const context = await panelContext(input.data.storeId);
  if (context.selected.id !== input.data.storeId) return { error: 'permission' };
  const { data: page } = await context.client.from('pages').select('id').eq('id', input.data.pageId)
    .eq('store_id', input.data.storeId).maybeSingle();
  if (!page) return { error: 'invalid' };
  const { error } = await context.client.rpc('publish_page', { p_page_id: input.data.pageId,
    ...(input.data.note ? { p_note: input.data.note } : {}) });
  if (error) return { error: 'save' };
  let fresh = false;
  try { fresh = await invalidateStorefront(input.data.storeId, input.data.pageId); } catch { fresh = false; }
  revalidatePath('/page/edit');
  return fresh ? {} : { error: 'cache' };
}

export async function restorePageVersion(raw: unknown): Promise<{ error?: 'invalid' | 'save' | 'permission' }> {
  const input = pageInput.extend({ versionId: z.uuid() }).safeParse(raw);
  if (!input.success) return { error: 'invalid' };
  const context = await panelContext(input.data.storeId);
  if (context.selected.id !== input.data.storeId) return { error: 'permission' };
  const { data: page } = await context.client.from('pages').select('id').eq('id', input.data.pageId)
    .eq('store_id', input.data.storeId).maybeSingle();
  if (!page) return { error: 'invalid' };
  const { error } = await context.client.rpc('restore_page_version', { p_page_id: input.data.pageId,
    p_version_id: input.data.versionId });
  if (error) return { error: 'save' };
  revalidatePath('/page/edit');
  return {};
}

export async function saveTheme(raw: unknown): Promise<{ error?: 'invalid' | 'save' | 'permission' }> {
  const input = z.object({ storeId: z.uuid(), theme: themeSchema }).safeParse(raw);
  if (!input.success) return { error: 'invalid' };
  const context = await panelContext(input.data.storeId);
  if (context.selected.id !== input.data.storeId) return { error: 'permission' };
  const { error } = await context.client.from('stores').update({ theme_draft: z.record(z.string(), z.json()).parse(input.data.theme) })
    .eq('id', input.data.storeId);
  return error ? { error: 'save' } : {};
}

export async function publishTheme(raw: unknown): Promise<{ error?: 'invalid' | 'save' | 'cache' | 'permission' }> {
  const input = z.object({ storeId: z.uuid(), theme: themeSchema }).safeParse(raw);
  if (!input.success) return { error: 'invalid' };
  const saved = await saveTheme(input.data);
  if (saved.error) return saved;
  const context = await panelContext(input.data.storeId);
  if (context.selected.id !== input.data.storeId) return { error: 'permission' };
  const { error } = await context.client.rpc('publish_store', { p_store_id: input.data.storeId });
  if (error) return { error: 'save' };
  let fresh = false;
  try { fresh = await invalidateStorefront(input.data.storeId); } catch { fresh = false; }
  return fresh ? {} : { error: 'cache' };
}
