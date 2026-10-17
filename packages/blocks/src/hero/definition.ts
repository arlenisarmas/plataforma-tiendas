import type { BlockDefinition } from '../types';
import { thumbnailFor } from '../thumbnail';
import { Hero } from './component';
import { heroSchema } from './schema';

export const heroDefinition = {
  type: 'hero',
  version: 1,
  category: 'portada',
  icon: 'panel-top',
  i18n: { name: 'blocks.hero', description: 'blocks.heroDescription' },
  schema: heroSchema,
  defaults: { title: '', align: 'left' },
  fields: [
    { name: 'title', kind: 'text', i18n: { label: 'blocks.heroTitle' }, simple: true },
    { name: 'subtitle', kind: 'textarea', i18n: { label: 'blocks.heroSubtitle' }, simple: true },
    {
      name: 'image',
      kind: 'image',
      i18n: { label: 'blocks.heroImage' },
      simple: true,
      onlyInVariants: ['background', 'split', 'collage'],
    },
    { name: 'cta.label', kind: 'text', i18n: { label: 'blocks.heroCta' }, simple: false },
  ],
  variants: ['background', 'split', 'minimal', 'collage'].map((id) => ({
    id,
    i18n: { name: `blocks.hero${id[0]?.toUpperCase()}${id.slice(1)}` },
    thumbnail: thumbnailFor('hero', id),
  })),
  defaultVariant: 'split',
  Component: Hero,
} satisfies BlockDefinition<typeof heroSchema>;
