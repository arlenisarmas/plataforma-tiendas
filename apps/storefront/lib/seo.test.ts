import { describe, expect, it } from 'vitest';
import { publicPaths, storeUrl } from './seo';

describe('store SEO', () => {
  it('rejects local and malformed hosts', () => {
    expect(storeUrl('localhost:3000')).toBeNull();
    expect(storeUrl('bad.example/evil')).toBeNull();
    expect(storeUrl('shop.example.com')?.origin).toBe('https://shop.example.com');
  });
  it('includes only public canonical paths', () => {
    expect(publicPaths([{ slug: 'about' }, { slug: '../bad' }, { slug: null }], [{ slug: 'item' }]))
      .toEqual(['/', '/about', '/producto/item']);
  });
});
