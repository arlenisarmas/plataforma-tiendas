import { createElement, type ReactNode } from 'react';
import { z } from 'zod';
import { getBlockDefinition } from './registry';
import type { BlockDefinition, StoreContext } from './types';
import type { Theme } from './theme';

const instanceSchema = z.object({
  id: z.string().min(1), type: z.string().min(1), version: z.number().int().positive(),
  variant: z.string().optional(), props: z.unknown(),
});
export type BlockRenderError = {
  id?: string;
  type?: string;
  reason: 'invalid-page' | 'invalid-block' | 'unknown-block' | 'duplicate-id' | 'version' | 'invalid-props' | 'loader';
};
type RenderOptions = {
  onError?: (error: BlockRenderError) => void;
  resolveDefinition?: (type: string) => BlockDefinition | undefined;
};

export async function renderPage(input: unknown, ctx: StoreContext, theme: Theme, options: RenderOptions = {}): Promise<ReactNode[]> {
  const report = options.onError ?? ((error: BlockRenderError) => console.error('Block omitted', error));
  const fail = (error: BlockRenderError): null => { report(error); return null; };
  let size: number;
  try { size = new TextEncoder().encode(JSON.stringify(input)).length; }
  catch { report({ reason: 'invalid-page' }); return []; }
  if (!Array.isArray(input) || input.length > 40 || size > 200_000) {
    report({ reason: 'invalid-page' });
    return [];
  }
  const seen = new Set<string>();
  const rendered = await Promise.all(input.map(async (raw): Promise<ReactNode> => {
    const parsed = instanceSchema.safeParse(raw);
    if (!parsed.success) return fail({ reason: 'invalid-block' });
    const block = parsed.data;
    const identity = { id: block.id, type: block.type };
    if (seen.has(block.id)) return fail({ ...identity, reason: 'duplicate-id' });
    seen.add(block.id);
    const definition = (options.resolveDefinition ?? getBlockDefinition)(block.type);
    if (!definition) return fail({ ...identity, reason: 'unknown-block' });
    if (block.version > definition.version || (block.version < definition.version && !definition.migrate))
      return fail({ ...identity, reason: 'version' });
    try {
      const migrated = block.version < definition.version ? definition.migrate?.(block.props, block.version) : block.props;
      const props = definition.schema.safeParse(migrated);
      if (!props.success) return fail({ ...identity, reason: 'invalid-props' });
      const variant = definition.variants.some((item) => item.id === block.variant)
        ? block.variant ?? definition.defaultVariant : definition.defaultVariant;
      const data = definition.loader ? await definition.loader(props.data, ctx) : null;
      return createElement(definition.Component, { key: block.id, props: props.data, variant, data, theme, ctx });
    } catch { return fail({ ...identity, reason: 'loader' }); }
  }));
  return rendered.filter((node) => node !== null);
}
