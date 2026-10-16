import { adminText } from '../../../lib/locale';
import { panelContext } from '../../../lib/panel-data';
import { MediaPicker } from '../../media-picker';
import { PanelShell } from '../../panel-shell';
import { ProductForm } from './product-form';

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ store?: string }> }) {
  const [params, t] = await Promise.all([searchParams, adminText()]);
  const context = await panelContext(params.store);
  const storeId = context.selected.id;
  const [categories, assets] = await Promise.all([
    context.client.from('categories').select('id,name').eq('store_id', storeId).order('position'),
    context.client.from('media_assets').select('id,path,alt_text,size_bytes').eq('store_id', storeId).eq('kind', 'image').order('created_at', { ascending: false }).limit(100),
  ]);
  if (categories.error || assets.error) throw categories.error ?? assets.error;
  const keys = ['name', 'description', 'price', 'stock', 'category', 'draft', 'active', 'saveDraft', 'publish',
    'advanced', 'slug', 'variantName', 'optionName', 'optionValues', 'compare', 'cost', 'sku', 'weight', 'addOption', 'saveError'] as const;
  const labels = Object.fromEntries(keys.map((key) => [key, t(`products.${key}`)])) as Record<(typeof keys)[number], string>;
  return <PanelShell context={context} active="products"><main className="space-y-5 p-4 md:p-8">
    <h1 className="text-3xl font-bold">{t('products.add')}</h1>
    <ProductForm storeId={storeId} categories={categories.data ?? []} labels={labels} media={
      <MediaPicker storeId={storeId} folder="products" initial={assets.data ?? []} labels={{
        choose: t('media.choose'), upload: t('media.upload'), camera: t('media.camera'), alt: t('media.alt'),
        suggestion: t('media.suggestion'), invalid: t('media.invalid'), failed: t('media.failed'),
        selected: t('media.selected'), empty: t('media.empty'),
      }} />
    } />
  </main></PanelShell>;
}
