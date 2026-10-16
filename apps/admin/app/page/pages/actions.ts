'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { slugify } from '@plataforma/core';
import { panelContext } from '../../../lib/panel-data';

const base = z.object({ storeId: z.uuid() });

export async function createPage(raw: unknown): Promise<{ id?: string; error?: string }> {
  const input = base.extend({ title: z.string().trim().min(1).max(120) }).safeParse(raw);
  if (!input.success) return { error: 'invalid' };
  const context = await panelContext(input.data.storeId);
  if (context.selected.id !== input.data.storeId) return { error: 'permission' };
  const slug = slugify(input.data.title);
  if (!slug) return { error: 'invalid' };
  const { data, error } = await context.client.from('pages').insert({ store_id: input.data.storeId,
    kind: 'custom', slug, title: input.data.title, draft_blocks: [], show_in_nav: true }).select('id').single();
  if (error || !data) return { error: 'save' };
  revalidatePath('/page/pages');
  return { id: data.id };
}

export async function updatePageSettings(raw: unknown): Promise<{ error?: string }> {
  const input = base.extend({ pageId: z.uuid(), title: z.string().trim().min(1).max(120),
    showInNav: z.boolean(), position: z.number().int().min(0).max(100) }).safeParse(raw);
  if (!input.success) return { error: 'invalid' };
  const context = await panelContext(input.data.storeId);
  if (context.selected.id !== input.data.storeId) return { error: 'permission' };
  const { data, error } = await context.client.from('pages').update({ title: input.data.title,
    show_in_nav: input.data.showInNav, nav_position: input.data.position })
    .eq('store_id', input.data.storeId).eq('id', input.data.pageId).select('id').single();
  if (error || !data) return { error: 'save' };
  revalidatePath('/page/pages');
  return {};
}
