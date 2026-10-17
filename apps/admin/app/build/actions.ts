'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getBlockDefinition, heroSchemaFor } from '../../lib/build-blocks';
import { panelContext } from '../../lib/panel-data';

const coverSchema = z.object({
  storeId: z.uuid(),
  title: z.string().trim().min(1).max(120),
  subtitle: z.string().trim().max(240).optional().default(''),
  variant: z.enum(['split', 'background', 'minimal']),
  assetId: z.uuid().optional(),
  alt: z.string().trim().max(300).optional(),
});
const blockSchema = z.object({ id: z.string().min(1), type: z.string(), version: z.number().int().positive(),
  variant: z.string().optional(), props: z.unknown(), hidden: z.boolean().optional() }).loose();

/** Paso «Tu portada»: actualiza el bloque de portada de la página de inicio y la publica. */
export async function saveCover(raw: unknown): Promise<{ error?: 'invalid' | 'permission' | 'save' }> {
  const input = coverSchema.safeParse(raw);
  if (!input.success) return { error: 'invalid' };
  const context = await panelContext(input.data.storeId);
  if (context.selected.id !== input.data.storeId) return { error: 'permission' };
  const { data: page, error } = await context.client.from('pages').select('id,draft_blocks')
    .eq('store_id', input.data.storeId).eq('kind', 'home').single();
  if (error || !page) return { error: 'save' };
  const blocks = z.array(blockSchema).catch([]).parse(page.draft_blocks);
  const definition = getBlockDefinition('hero');
  if (!definition) return { error: 'save' };
  const index = blocks.findIndex((block) => block.type === 'hero');
  const previous = index >= 0 ? z.record(z.string(), z.unknown()).catch({}).parse(blocks[index]?.props) : {};
  const props = heroSchemaFor().safeParse({
    ...previous,
    title: input.data.title,
    ...(input.data.subtitle ? { subtitle: input.data.subtitle } : { subtitle: undefined }),
    ...(input.data.assetId ? { image: { assetId: input.data.assetId, alt: input.data.alt || input.data.title } } : {}),
  });
  if (!props.success) return { error: 'invalid' };
  const hero = { id: index >= 0 ? blocks[index]!.id : crypto.randomUUID(), type: 'hero', version: definition.version,
    variant: input.data.variant, props: props.data };
  const next = index >= 0 ? blocks.map((block, at) => at === index ? { ...block, ...hero } : block) : [hero, ...blocks];
  const saved = await context.client.from('pages').update({ draft_blocks: z.array(z.json()).parse(next) })
    .eq('store_id', input.data.storeId).eq('id', page.id).select('id').single();
  if (saved.error) return { error: 'save' };
  const published = await context.client.rpc('publish_page', { p_page_id: page.id });
  if (published.error) return { error: 'save' };
  revalidatePath('/build');
  return {};
}
