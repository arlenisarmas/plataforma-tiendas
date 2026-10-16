import { describe, expect, it } from 'vitest';
import { legalDraftPages } from './legal-drafts';

describe('legal page drafts', () => {
  it('creates three editable, unpublished legal pages without changing existing pages', () => {
    const pages = legalDraftPages({ terminos: { title: 'Términos', body: 'Guía para Argentina' },
      privacidad: { title: 'Privacidad', body: 'Guía para Argentina' },
      devoluciones: { title: 'Devoluciones', body: 'Guía para Argentina' } });
    expect(pages.map((page) => page.slug)).toEqual(['terminos', 'privacidad', 'devoluciones']);
    expect(pages.every((page) => page.kind === 'legal' && !page.show_in_nav &&
      !('published_version_id' in page) && page.draft_blocks[0]?.props.body.includes('Argentina'))).toBe(true);
    expect(new Set(pages.map((page) => page.draft_blocks[0]?.id)).size).toBe(3);
  });
});
