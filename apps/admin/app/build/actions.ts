'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getBlockDefinition, headerTheme, heroSchemaFor, isBuildStep, onboardingSchema } from '../../lib/build-blocks';
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

type Context = Awaited<ReturnType<typeof panelContext>>;

/** Mezcla datos en `stores.onboarding` (progreso del armado guiado). */
async function updateOnboarding(context: Context, storeId: string, change: { buildStep?: string; done?: string }) {
  const { data } = await context.client.from('stores').select('onboarding').eq('id', storeId).single();
  const current = onboardingSchema.parse(data?.onboarding ?? {});
  const done = change.done ? [...new Set([...(current.done ?? []), change.done])] : current.done;
  const next = { ...current, ...(change.buildStep ? { buildStep: change.buildStep } : {}), ...(done ? { done } : {}) };
  const { error } = await context.client.from('stores').update({ onboarding: z.record(z.string(), z.json()).parse(next) }).eq('id', storeId);
  return !error;
}

async function ownContext(storeId: string) {
  const context = await panelContext(storeId);
  return context.selected.id === storeId ? context : null;
}

/** Recuerda el último paso visitado para poder retomar donde quedó. */
export async function rememberStep(raw: unknown): Promise<void> {
  const input = z.object({ storeId: z.uuid(), step: z.string() }).safeParse(raw);
  if (!input.success || !isBuildStep(input.data.step)) return;
  const context = await ownContext(input.data.storeId);
  if (context) await updateOnboarding(context, input.data.storeId, { buildStep: input.data.step });
}

/** Paso «Tu logo»: guarda la imagen elegida, o confirma que por ahora se usa solo el nombre. */
export async function saveLogo(raw: unknown): Promise<{ error?: 'invalid' | 'permission' | 'save' }> {
  const input = z.object({ storeId: z.uuid(), assetId: z.uuid().nullable() }).safeParse(raw);
  if (!input.success) return { error: 'invalid' };
  const context = await ownContext(input.data.storeId);
  if (!context) return { error: 'permission' };
  if (input.data.assetId) {
    const { data: asset } = await context.client.from('media_assets').select('id').eq('id', input.data.assetId)
      .eq('store_id', input.data.storeId).eq('kind', 'image').maybeSingle();
    if (!asset) return { error: 'invalid' };
  }
  const { error } = await context.client.from('stores').update({ logo_asset_id: input.data.assetId }).eq('id', input.data.storeId);
  if (error) return { error: 'save' };
  if (!(await updateOnboarding(context, input.data.storeId, { done: 'logo' }))) return { error: 'save' };
  revalidatePath('/build');
  return {};
}

const headerInput = z.object({
  storeId: z.uuid(),
  palette: z.enum(['calido', 'fresco', 'natural', 'elegante', 'vibrante']),
  layout: z.enum(['izquierda', 'centrado']),
  style: z.enum(['claro', 'color']),
  fonts: z.enum(['moderna', 'clasica', 'amigable', 'robusta']),
});

/** Paso «La barra de arriba»: colores, letra y forma del encabezado. */
export async function saveHeader(raw: unknown): Promise<{ error?: 'invalid' | 'permission' | 'save' }> {
  const input = headerInput.safeParse(raw);
  if (!input.success) return { error: 'invalid' };
  const context = await ownContext(input.data.storeId);
  if (!context) return { error: 'permission' };
  const { data: store } = await context.client.from('stores').select('theme_draft').eq('id', input.data.storeId).single();
  const { storeId, ...choice } = input.data;
  const theme = headerTheme(store?.theme_draft, choice);
  const { error } = await context.client.from('stores').update({ theme_draft: z.record(z.string(), z.json()).parse(theme) }).eq('id', storeId);
  if (error) return { error: 'save' };
  if (!(await updateOnboarding(context, storeId, { done: 'header' }))) return { error: 'save' };
  revalidatePath('/build');
  return {};
}

/** Paso «Tus productos»: cómo se muestran en la página de inicio (grilla, carrusel o lista). */
export async function saveProductsLayout(raw: unknown): Promise<{ error?: 'invalid' | 'permission' | 'save' }> {
  const input = z.object({ storeId: z.uuid(), variant: z.enum(['grid', 'carousel', 'featured-list']) }).safeParse(raw);
  if (!input.success) return { error: 'invalid' };
  const context = await ownContext(input.data.storeId);
  if (!context) return { error: 'permission' };
  const { data: page, error } = await context.client.from('pages').select('id,draft_blocks')
    .eq('store_id', input.data.storeId).eq('kind', 'home').single();
  if (error || !page) return { error: 'save' };
  const definition = getBlockDefinition('featured-products');
  if (!definition) return { error: 'save' };
  const blocks = z.array(blockSchema).catch([]).parse(page.draft_blocks);
  const index = blocks.findIndex((block) => block.type === 'featured-products');
  const next = index >= 0
    ? blocks.map((block, at) => at === index ? { ...block, variant: input.data.variant } : block)
    : [...blocks.slice(0, 1), { id: crypto.randomUUID(), type: 'featured-products', version: definition.version,
        variant: input.data.variant, props: definition.defaults }, ...blocks.slice(1)];
  const saved = await context.client.from('pages').update({ draft_blocks: z.array(z.json()).parse(next) })
    .eq('store_id', input.data.storeId).eq('id', page.id).select('id').single();
  if (saved.error) return { error: 'save' };
  const published = await context.client.rpc('publish_page', { p_page_id: page.id });
  if (published.error) return { error: 'save' };
  revalidatePath('/build');
  return {};
}
