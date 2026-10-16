import { afterEach, describe, expect, it, vi } from 'vitest';
import { findStoreByHost } from './storefront-data';

const publishedId = 'a0000000-0000-4000-8000-000000000001';
afterEach(() => vi.unstubAllGlobals());

describe('storefront tenant lookup', () => {
  it('resolves a published custom domain through the public domain view', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify([{ hostname: 'shop.example.com', store_id: publishedId }]), { status: 200 }));
    vi.stubGlobal('fetch', fetcher);
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://db.example.com');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'public-test-key');
    expect(await findStoreByHost('shop.example.com')).toBe(publishedId);
    const [url, init] = fetcher.mock.calls[0] as [URL, RequestInit & { next: { tags: string[] } }];
    expect(url.pathname).toBe('/rest/v1/domains');
    expect(url.searchParams.get('hostname')).toBe('eq.shop.example.com');
    expect(init.headers).toMatchObject({ 'Accept-Profile': 'storefront' });
    expect(init.next.tags).toContain('domain:shop.example.com');
  });

  it('returns no tenant for a draft store in development', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('[]', { status: 200 }));
    vi.stubGlobal('fetch', fetcher);
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://db.example.com');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'public-test-key');
    expect(await findStoreByHost('localhost', 'carpinteria')).toBeUndefined();
    expect((fetcher.mock.calls[0]?.[0] as URL).searchParams.get('slug')).toBe('eq.carpinteria');
  });

  it('rejects malformed tenant selectors before querying', async () => {
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    expect(await findStoreByHost('localhost', '../other')).toBeUndefined();
    expect(await findStoreByHost('bad/host')).toBeUndefined();
    expect(fetcher).not.toHaveBeenCalled();
  });
});
