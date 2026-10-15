import type { BlockDefinition } from '../types';
import { thumbnailFor } from '../thumbnail';
import { Spacer } from './component';
import { spacerSchema } from './schema';

export const spacerDefinition = {
  type: 'spacer',
  version: 1,
  category: 'contenido',
  icon: 'space',
  i18n: { name: 'blocks.spacer', description: 'blocks.spacerDescription' },
  schema: spacerSchema,
  defaults: {},
  fields: [],
  variants: ['small', 'medium', 'large', 'line'].map((id) => ({
    id,
    i18n: { name: `blocks.spacer${id[0]?.toUpperCase()}${id.slice(1)}` },
    thumbnail: thumbnailFor('spacer', id),
  })),
  defaultVariant: 'medium',
  Component: Spacer,
} satisfies BlockDefinition<typeof spacerSchema>;
