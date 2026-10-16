import { notFound } from 'next/navigation';
import { z } from 'zod';
import { adminText } from '../../../lib/locale';
import { panelContext } from '../../../lib/panel-data';
import { PanelShell } from '../../panel-shell';
import { BlockEditor } from './block-editor';

const blockSchema = z.object({ id: z.string().min(1), type: z.string(), version: z.number().int().positive(),
  variant: z.string().optional(), props: z.unknown(), hidden: z.boolean().optional() });

export default async function EditPage({ searchParams }: { searchParams: Promise<{ store?: string; page?: string }> }) {
  const [params, t] = await Promise.all([searchParams, adminText()]);
  const context = await panelContext(params.store);
  const storeId = context.selected.id;
  const requested = z.uuid().safeParse(params.page);
  let pageQuery = context.client.from('pages').select('id,draft_blocks').eq('store_id', storeId);
  pageQuery = requested.success ? pageQuery.eq('id', requested.data) : pageQuery.eq('kind', 'home');
  const [page, assets, products, categories, store] = await Promise.all([
    pageQuery.maybeSingle(),
    context.client.from('media_assets').select('id,path,alt_text,size_bytes').eq('store_id', storeId).eq('kind', 'image').limit(100),
    context.client.from('products').select('id,name').eq('store_id', storeId).limit(100),
    context.client.from('categories').select('id,name').eq('store_id', storeId).limit(100),
    context.client.from('stores').select('default_locale').eq('id', storeId).single(),
  ]);
  const failure = [page, assets, products, categories, store].find((result) => result.error)?.error;
  if (failure) throw failure;
  if (!page.data || !store.data) notFound();
  const keys = ['title', 'sections', 'add', 'edit', 'design', 'simple', 'advanced', 'up', 'down',
    'duplicate', 'hide', 'show', 'delete', 'undo', 'redo', 'saved', 'saving', 'error', 'addItem',
    'removeItem', 'choose', 'empty', 'view', 'list'] as const;
  const labels = Object.fromEntries(keys.map((key) => [key, t(`editor.${key}`)])) as Record<(typeof keys)[number], string>;
  const mediaKeys = ['choose', 'upload', 'camera', 'alt', 'suggestion', 'invalid', 'failed', 'selected', 'empty'] as const;
  const mediaLabels = Object.fromEntries(mediaKeys.map((key) => [key, t(`media.${key}`)])) as Record<(typeof mediaKeys)[number], string>;
  const blocks = z.array(blockSchema).safeParse(page.data.draft_blocks);
  const initial = blocks.success ? blocks.data.map(({ variant, hidden, ...block }) => ({ ...block,
    ...(variant ? { variant } : {}), ...(hidden !== undefined ? { hidden } : {}) })) : [];
  return <PanelShell context={context} active="page"><main className="p-4 md:p-8">
    <BlockEditor storeId={storeId} pageId={page.data.id} initial={initial}
      assets={assets.data ?? []} products={products.data ?? []} categories={categories.data ?? []}
      locale={store.data.default_locale} labels={labels} mediaLabels={mediaLabels} />
  </main></PanelShell>;
}
