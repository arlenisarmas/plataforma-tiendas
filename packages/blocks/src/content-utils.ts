import { z } from 'zod';
import { thumbnailFor } from './thumbnail';

export const safeUrl = z.url().refine((url) => /^https?:\/\//i.test(url));
export const asset = z.object({ assetId: z.uuid(), alt: z.string().max(180).default('') });
export const titleField = { name: 'title', kind: 'text', i18n: { label: 'blocks.richTextTitle' }, simple: true } as const;
export function contentVariants(type: string, ids: string[]) {
  return ids.map((id) => ({ id, i18n: { name: `blocks.${type}${id[0]?.toUpperCase()}${id.slice(1)}` }, thumbnail: thumbnailFor(type, id) }));
}
