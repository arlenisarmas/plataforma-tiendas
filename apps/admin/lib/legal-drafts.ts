export const legalSlugs = ['terminos', 'privacidad', 'devoluciones'] as const;
export type LegalSlug = (typeof legalSlugs)[number];

export type LegalCopy = Record<LegalSlug, { title: string; body: string }>;

export function legalDraftPages(copy: LegalCopy) {
  return legalSlugs.map((slug) => ({
    kind: 'legal' as const,
    slug,
    title: copy[slug].title,
    show_in_nav: false,
    draft_blocks: [{ id: crypto.randomUUID(), type: 'rich-text', version: 1, variant: 'left',
      props: { title: copy[slug].title, body: copy[slug].body } }],
  }));
}
