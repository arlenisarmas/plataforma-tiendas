'use server';

import { z } from 'zod';
import { getBlockDefinition } from '@plataforma/blocks';
import { panelContext } from '../../../lib/panel-data';

const draftSchema = z.object({ storeId: z.uuid(), pageId: z.uuid(), blocks: z.array(z.object({
  id: z.string().min(1), type: z.string().min(1), version: z.number().int().positive(),
  variant: z.string().optional(), props: z.unknown(), hidden: z.boolean().optional(),
})).max(40) });

export async function saveDraftBlocks(raw: unknown): Promise<{ error?: 'invalid' | 'permission' | 'save' }> {
  const input = draftSchema.safeParse(raw);
  if (!input.success || new TextEncoder().encode(JSON.stringify(raw)).length > 200_000) return { error: 'invalid' };
  const ids = input.data.blocks.map((block) => block.id);
  if (new Set(ids).size !== ids.length) return { error: 'invalid' };
  for (const block of input.data.blocks) {
    const definition = getBlockDefinition(block.type);
    if (!definition || block.version !== definition.version ||
      (block.variant && !definition.variants.some((variant) => variant.id === block.variant)) ||
      !definition.schema.safeParse(block.props).success) return { error: 'invalid' };
  }
  const context = await panelContext(input.data.storeId);
  if (context.selected.id !== input.data.storeId) return { error: 'permission' };
  const blocks = z.array(z.json()).parse(input.data.blocks);
  const { data, error } = await context.client.from('pages').update({ draft_blocks: blocks })
    .eq('store_id', input.data.storeId).eq('id', input.data.pageId).select('id').single();
  return error || !data ? { error: 'save' } : {};
}
