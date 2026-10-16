import { z } from 'zod';
import { createTheme, renderPage, themeSchema } from '@plataforma/blocks';
import { readPreviewToken } from './preview-token';
import { mediaUrl } from './storefront-data';

const storeSchema = z.object({ id: z.uuid(), name: z.string(), default_locale: z.string(), theme_draft: z.unknown() });
const pageSchema = z.object({ id: z.uuid(), store_id: z.uuid(), draft_blocks: z.unknown() });
const mediaSchema = z.object({ id: z.uuid(), path: z.string() });

async function privateRows<T extends z.ZodType>(view: string, schema: T, filters: Record<string, string>, jwt: string): Promise<z.infer<T>[]> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) throw new Error('Missing public Supabase settings');
  const url = new URL(`rest/v1/${view}`, `${base.replace(/\/$/, '')}/`);
  url.searchParams.set('select', '*');
  for (const [field, value] of Object.entries(filters)) url.searchParams.set(field, value);
  const response = await fetch(url, { cache: 'no-store', headers: { apikey: key, Authorization: `Bearer ${jwt}` } });
  if (!response.ok) throw new Error('Preview data unavailable');
  return z.array(schema).parse(await response.json());
}

export async function draftContext(token: string) {
  const payload = readPreviewToken(token, process.env.PREVIEW_SECRET);
  if (!payload) return null;
  const [stores, pages, media] = await Promise.all([
    privateRows('stores', storeSchema, { id: `eq.${payload.storeId}`, limit: '1' }, payload.accessToken),
    privateRows('pages', pageSchema, { id: `eq.${payload.pageId}`, store_id: `eq.${payload.storeId}`, limit: '1' }, payload.accessToken),
    privateRows('media_assets', mediaSchema, { store_id: `eq.${payload.storeId}` }, payload.accessToken),
  ]);
  const store = stores[0], page = pages[0];
  if (!store || !page) return null;
  const assets = new Map(media.map((asset) => [asset.id, mediaUrl(asset.path)]));
  const theme = themeSchema.safeParse(store.theme_draft);
  return { store, page, origin: payload.origin, theme: theme.success ? theme.data : createTheme(),
    ctx: { storeId: store.id, locale: store.default_locale, assetUrl: (id: string) => assets.get(id) } };
}

export async function renderDraft(token: string, blocks?: unknown, themeInput?: unknown) {
  const draft = await draftContext(token);
  if (!draft) return null;
  const theme = themeInput === undefined ? draft.theme : themeSchema.parse(themeInput);
  const nodes = await renderPage(blocks ?? draft.page.draft_blocks, draft.ctx, theme);
  return { nodes, theme, origin: draft.origin, storeName: draft.store.name };
}
