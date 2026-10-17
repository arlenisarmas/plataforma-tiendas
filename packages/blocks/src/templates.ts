import { createTheme, curatedPalettes, themeSchema } from './theme';
import { getBlockDefinition } from './registry';
import type { BlockInstance } from './types';

export const templateKinds = ['mascotas', 'carpinteria-muebles', 'ropa-accesorios', 'comida-casera', 'general'] as const;
export type TemplateKind = (typeof templateKinds)[number];

export const templatePalettes = {
  mascotas: 'vibrante', 'carpinteria-muebles': 'natural', 'ropa-accesorios': 'elegante',
  'comida-casera': 'calido', general: 'fresco',
} as const;

export type TemplateCopy = {
  intro: string; about: string; contact: string; faqQuestion: string; faqAnswer: string;
  aboutTitle: string; contactTitle: string; faqTitle: string; productsTitle: string;
};

function block(type: string, props: unknown, variant?: string): BlockInstance {
  const definition = getBlockDefinition(type);
  if (!definition) throw new Error(`Unknown template block: ${type}`);
  const parsed = definition.schema.parse(props);
  return { id: crypto.randomUUID(), type, version: definition.version, variant: variant ?? definition.defaultVariant, props: parsed };
}

export function createStoreTemplate(kind: TemplateKind, name: string, copy: TemplateCopy,
  palette: keyof typeof curatedPalettes = templatePalettes[kind]) {
  const theme = themeSchema.parse(createTheme(palette));
  return {
    theme,
    pages: [
      { kind: 'home' as const, slug: '', title: name, blocks: [
        block('hero', { title: name, subtitle: copy.intro, align: 'left' }, 'split'),
        block('featured-products', { title: copy.productsTitle, limit: 8 }),
      ] },
      { kind: 'custom' as const, slug: 'sobre-nosotros', title: copy.aboutTitle,
        blocks: [block('rich-text', { title: copy.aboutTitle, body: copy.about })] },
      { kind: 'custom' as const, slug: 'contacto', title: copy.contactTitle,
        blocks: [block('contact', { title: copy.contactTitle, whatsappMessage: copy.contact })] },
      { kind: 'custom' as const, slug: 'preguntas-frecuentes', title: copy.faqTitle,
        blocks: [block('faq', { title: copy.faqTitle, items: [{ question: copy.faqQuestion, answer: copy.faqAnswer }] })] },
    ],
  };
}
