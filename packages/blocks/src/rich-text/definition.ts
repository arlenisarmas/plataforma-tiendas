import type { BlockDefinition } from '../types';
import { thumbnailFor } from '../thumbnail';
import { RichText } from './component';
import { richTextSchema } from './schema';

export const richTextDefinition = {
  type: 'rich-text',
  version: 1,
  category: 'contenido',
  icon: 'text',
  i18n: { name: 'blocks.richText', description: 'blocks.richTextDescription' },
  schema: richTextSchema,
  defaults: { body: '' },
  fields: [
    { name: 'title', kind: 'text', i18n: { label: 'blocks.richTextTitle' }, simple: true },
    { name: 'body', kind: 'textarea', i18n: { label: 'blocks.richTextBody' }, simple: true },
  ],
  variants: ['centered', 'left', 'highlighted'].map((id) => ({
    id,
    i18n: { name: `blocks.richText${id[0]?.toUpperCase()}${id.slice(1)}` },
    thumbnail: thumbnailFor('rich-text', id),
  })),
  defaultVariant: 'left',
  Component: RichText,
} satisfies BlockDefinition<typeof richTextSchema>;
