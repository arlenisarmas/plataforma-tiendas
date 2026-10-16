import { afterEach, describe, expect, it, vi } from 'vitest';
import { catalogQuerySchema, searchTerm } from './catalog';
import { readStorefront, variantSchema } from './storefront-data';

afterEach(() => vi.unstubAllGlobals());

describe('catalog query', () => {
  it('normalizes punctuation before Postgres full-text search', () => {
    expect(searchTerm('  cama (suave)!  ')).toBe('cama & suave');
    expect(searchTerm('')).toBe('');
  });
  it('rejects an invalid category and limits search text', () => {
    expect(catalogQuerySchema.safeParse({ category: 'other-store' }).success).toBe(false);
    expect(catalogQuerySchema.safeParse({ q: 'x'.repeat(81) }).success).toBe(false);
  });
  it('does not cache live variant availability', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://db.example.com');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'public-test-key');
    const fetcher = vi.fn().mockResolvedValue(new Response('[]', { status: 200 }));
    vi.stubGlobal('fetch', fetcher);
    await readStorefront('variants', variantSchema, { store_id: 'eq.store' }, [], true);
    expect((fetcher.mock.calls[0]?.[1] as RequestInit).cache).toBe('no-store');
  });
});
