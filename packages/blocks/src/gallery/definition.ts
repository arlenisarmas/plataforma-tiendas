import type { BlockDefinition } from '../types';
import { contentVariants, titleField } from '../content-utils';
import { gallerySchema } from './schema';
import { Gallery } from './component';
export const galleryDefinition = {
  type: 'gallery', version: 1, category: 'contenido', icon: 'images',
  i18n: { name: 'blocks.gallery', description: 'blocks.galleryDescription' },
  schema: gallerySchema, defaults: { title: '', images: [] },
  fields: [titleField, { name: 'images', kind: 'list', i18n: { label: 'blocks.galleryImages' }, simple: true, maxItems: 12,
    itemFields: [{ name: 'assetId', kind: 'image', i18n: { label: 'blocks.heroImage' }, simple: true },
      { name: 'alt', kind: 'text', i18n: { label: 'blocks.imageAlt' }, simple: false }] }],
  variants: contentVariants('gallery', ['grid', 'mosaic', 'carousel']), defaultVariant: 'grid', Component: Gallery,
} satisfies BlockDefinition<typeof gallerySchema>;
