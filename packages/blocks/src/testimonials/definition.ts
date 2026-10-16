import type { BlockDefinition } from '../types';
import { contentVariants, titleField } from '../content-utils';
import { testimonialsSchema } from './schema';
import { Testimonials } from './component';
export const testimonialsDefinition = {
  type: 'testimonials', version: 1, category: 'confianza', icon: 'quote',
  i18n: { name: 'blocks.testimonials', description: 'blocks.testimonialsDescription' },
  schema: testimonialsSchema, defaults: { title: '', items: [] },
  fields: [titleField, { name: 'items', kind: 'list', i18n: { label: 'blocks.testimonialsItems' }, simple: true, maxItems: 8,
    itemFields: [{ name: 'quote', kind: 'textarea', i18n: { label: 'blocks.testimonialQuote' }, simple: true },
      { name: 'author', kind: 'text', i18n: { label: 'blocks.testimonialAuthor' }, simple: true }] }],
  variants: contentVariants('testimonials', ['cards', 'carousel', 'large-quote']), defaultVariant: 'cards', Component: Testimonials,
} satisfies BlockDefinition<typeof testimonialsSchema>;
