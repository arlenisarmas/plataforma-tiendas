import { describe, expect, it } from 'vitest';
import { messages } from '@plataforma/i18n';
import { getBlockDefinition } from './registry';
import { themeSchema } from './theme';
import { createStoreTemplate, templateKinds } from './templates';

describe('store templates', () => {
  it.each(templateKinds)('validates the %s template in every language', (kind) => {
    for (const locale of ['es-419', 'es-AR', 'en'] as const) {
      const copy = messages[locale].blocks.templates[kind];
      const labels = messages[locale].admin.storeTemplate;
      const template = createStoreTemplate(kind, 'Mi tienda', { ...copy, aboutTitle: labels.about,
        contactTitle: labels.contact, faqTitle: labels.faq, productsTitle: labels.products });
      expect(themeSchema.safeParse(template.theme).success).toBe(true);
      expect(template.pages.map((page) => page.kind)).toEqual(['home', 'custom', 'custom', 'custom']);
      for (const page of template.pages) {
        for (const block of page.blocks) {
          const definition = getBlockDefinition(block.type);
          expect(definition?.schema.safeParse(block.props).success).toBe(true);
          expect(definition?.variants.some((variant) => variant.id === block.variant)).toBe(true);
        }
      }
    }
  });
});
