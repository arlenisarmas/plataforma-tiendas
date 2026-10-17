import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { z } from 'zod';
import { adminText } from '../../../lib/locale';
import { panelContext } from '../../../lib/panel-data';
import { PanelShell } from '../../panel-shell';
import { createPreviewToken } from '../../../lib/preview-token';
import { BlockEditor } from './block-editor';

const blockSchema = z.object({ id: z.string().min(1), type: z.string(), version: z.number().int().positive(),
  variant: z.string().optional(), props: z.unknown(), hidden: z.boolean().optional() });

function previewExpiry() { return Date.now() + 15 * 60_000; }

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
    context.client.from('stores').select('default_locale,theme_draft').eq('id', storeId).single(),
  ]);
  const failure = [page, assets, products, categories, store].find((result) => result.error)?.error;
  if (failure) throw failure;
  if (!page.data || !store.data) notFound();
  const keys = ['title', 'sections', 'add', 'edit', 'design', 'simple', 'advanced', 'up', 'down',
    'duplicate', 'hide', 'show', 'delete', 'undo', 'redo', 'saved', 'saving', 'error', 'addItem',
    'removeItem', 'choose', 'empty', 'view', 'list', 'phone', 'computer', 'publish', 'published',
    'versions', 'restore', 'note', 'previewUnavailable', 'theme', 'palette', 'font', 'radius',
    'header', 'footer', 'publishTheme', 'saveTheme', 'searchHeader', 'socialFooter', 'paymentsFooter', 'footerText'] as const;
  const labels = Object.fromEntries(keys.map((key) => [key, t(`editor.${key}`)])) as Record<(typeof keys)[number], string>;
  const mediaKeys = ['choose', 'upload', 'camera', 'alt', 'suggestion', 'invalid', 'failed', 'selected', 'empty'] as const;
  const mediaLabels = Object.fromEntries(mediaKeys.map((key) => [key, t(`media.${key}`)])) as Record<(typeof mediaKeys)[number], string>;
  const blocks = z.array(blockSchema).safeParse(page.data.draft_blocks);
  const { data: versions } = await context.client.from('page_versions').select('id,version,note,created_at')
    .eq('store_id', storeId).eq('page_id', page.data.id).order('version', { ascending: false }).limit(20);
  const initial = blocks.success ? blocks.data.map(({ variant, hidden, ...block }) => ({ ...block,
    ...(variant ? { variant } : {}), ...(hidden !== undefined ? { hidden } : {}) })) : [];
  const { data: { session } } = await context.client.auth.getSession();
  const requestHeaders = await headers();
  const host = requestHeaders.get('host') ?? 'localhost:3001';
  const scheme = requestHeaders.get('x-forwarded-proto') ?? (host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https');
  const origin = `${scheme}://${host}`;
  const previewBase = process.env.NEXT_PUBLIC_STOREFRONT_URL || 'http://localhost:3000';
  const token = session?.access_token && process.env.PREVIEW_SECRET ? createPreviewToken({ storeId,
    pageId: page.data.id, accessToken: session.access_token, origin, expiresAt: previewExpiry() },
  process.env.PREVIEW_SECRET) : null;
  const preview = token ? { token, url: `${previewBase.replace(/\/$/, '')}/preview/${token}`,
    origin: new URL(previewBase).origin } : null;
  return <PanelShell context={context} active="page"><main className="p-4 md:p-8">
    <BlockEditor storeId={storeId} pageId={page.data.id} initial={initial}
      assets={assets.data ?? []} products={products.data ?? []} categories={categories.data ?? []}
      locale={store.data.default_locale} labels={labels} mediaLabels={mediaLabels}
      preview={preview} themeInput={store.data.theme_draft} versions={versions ?? []} />
  </main></PanelShell>;
}
