import type { BlockDefinition } from '../types';
import { contentVariants, titleField } from '../content-utils';
import { faqSchema } from './schema';
import { Faq } from './component';
export const faqDefinition = {
  type: 'faq', version: 1, category: 'confianza', icon: 'circle-help',
  i18n: { name: 'blocks.faq', description: 'blocks.faqDescription' },
  schema: faqSchema, defaults: { title: '', items: [] },
  fields: [titleField, { name: 'items', kind: 'list', i18n: { label: 'blocks.faqItems' }, simple: true, maxItems: 12,
    itemFields: [{ name: 'question', kind: 'text', i18n: { label: 'blocks.faqQuestion' }, simple: true },
      { name: 'answer', kind: 'textarea', i18n: { label: 'blocks.faqAnswer' }, simple: true }] }],
  variants: contentVariants('faq', ['accordion', 'two-columns']), defaultVariant: 'accordion', Component: Faq,
} satisfies BlockDefinition<typeof faqSchema>;
