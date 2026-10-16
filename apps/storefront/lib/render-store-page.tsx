import { notFound } from 'next/navigation';
import { renderPage, createTheme, themeSchema } from '@plataforma/blocks';
import { mediaSchema, pageSchema, readStorefront, storeSchema } from './storefront-data';

export async function RenderStorePage({ storeId, slug }: { storeId: string; slug?: string }) {
  const [stores, pageReferences, media] = await Promise.all([
    readStorefront('stores', storeSchema, { id: `eq.${storeId}`, limit: '1' }, [`store:${storeId}`]),
    readStorefront('pages', pageSchema, { store_id: `eq.${storeId}`, ...(slug ? { slug: `eq.${slug}` } : { kind: 'eq.home' }), limit: '1' }, [`store:${storeId}`]),
    readStorefront('media', mediaSchema, { store_id: `eq.${storeId}` }, [`store:${storeId}`]),
  ]);
  const store = stores[0]; const pageReference = pageReferences[0];
  if (!store || !pageReference) notFound();
  const page = (await readStorefront('pages', pageSchema,
    { id: `eq.${pageReference.id}`, store_id: `eq.${storeId}`, limit: '1' }, [`page:${pageReference.id}`]))[0];
  if (!page) notFound();
  const theme = themeSchema.safeParse(store.theme);
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) throw new Error('Missing public Supabase URL');
  const assets = new Map(media.map((asset) => [asset.id, `${base.replace(/\/$/, '')}/storage/v1/object/public/store-media/${asset.path.split('/').map(encodeURIComponent).join('/')}`]));
  const nodes = await renderPage(page.blocks, { storeId, locale: store.default_locale, assetUrl: (id) => assets.get(id) },
    theme.success ? theme.data : createTheme());
  return <>{nodes}</>;
}
