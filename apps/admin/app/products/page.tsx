import { formatMoney, type CurrencyCode } from '@plataforma/core';
import { z } from 'zod';
import { adminText } from '../../lib/locale';
import { panelContext } from '../../lib/panel-data';
import { PanelShell } from '../panel-shell';

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ store?: string; q?: string; category?: string; saved?: string }> }) {
  const [params, t] = await Promise.all([searchParams, adminText()]);
  const context = await panelContext(params.store);
  const storeId = context.selected.id;
  const query = z.string().trim().max(80).catch('').parse(params.q);
  const category = z.uuid().safeParse(params.category);
  const [categories, variants, images, store] = await Promise.all([
    context.client.from('categories').select('id,name,parent_id,position').eq('store_id', storeId).order('position'),
    context.client.from('product_variants').select('id,product_id,price_amount,is_default').eq('store_id', storeId),
    context.client.from('product_images').select('product_id,asset_id').eq('store_id', storeId).eq('position', 0),
    context.client.from('stores').select('currency,default_locale').eq('id', storeId).single(),
  ]);
  let productsQuery = context.client.from('products').select('id,name,status,category_id').eq('store_id', storeId).order('updated_at', { ascending: false });
  if (query) productsQuery = productsQuery.ilike('name', `%${query.replaceAll('%', '').replaceAll('_', '')}%`);
  if (category.success) productsQuery = productsQuery.eq('category_id', category.data);
  const products = await productsQuery;
  const failure = [categories, variants, images, store, products].find((result) => result.error)?.error;
  if (failure) throw failure;
  const data = products.data ?? [];
  const prices = new Map((variants.data ?? []).filter((item) => item.is_default).map((item) => [item.product_id, item.price_amount]));
  const defaultVariants = (variants.data ?? []).filter((item) => item.is_default);
  const { data: balances } = defaultVariants.length ? await context.client.from('inventory').select('variant_id,on_hand,reserved')
    .eq('store_id', storeId).in('variant_id', defaultVariants.map((item) => item.id)) : { data: [] };
  const stock = new Map((balances ?? []).map((item) => [item.variant_id, item.on_hand - item.reserved]));
  const variantByProduct = new Map(defaultVariants.map((item) => [item.product_id, item.id]));
  const photos = new Map((images.data ?? []).map((item) => [item.product_id, item.asset_id]));
  const { data: assets } = photos.size ? await context.client.from('media_assets').select('id,path,alt_text').eq('store_id', storeId).in('id', [...photos.values()]) : { data: [] };
  const assetMap = new Map((assets ?? []).map((item) => [item.id, item]));
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '') ?? '';
  return <PanelShell context={context} active="products"><main className="space-y-5 p-4 md:p-8">
    <h1 className="text-3xl font-bold">{t('products.title')}</h1>
    <div className="flex flex-wrap gap-3"><a className="auth-primary" href={`/products/new?store=${storeId}`}>{t('products.add')}</a>
      <a className="auth-secondary" href={`/products/categories?store=${storeId}`}>{t('products.categories')}</a></div>
    {params.saved && <p role="status" className="text-green-800">{t('products.saved')}</p>}
    <form className="grid gap-3 sm:grid-cols-2" action="/products" method="get"><input type="hidden" name="store" value={storeId} />
      <label>{t('products.search')}<input className="auth-input" name="q" defaultValue={query} /></label>
      <label>{t('products.filter')}<select className="auth-input" name="category" defaultValue={category.success ? category.data : ''}>
        <option value="">{t('products.all')}</option>{(categories.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <button className="auth-secondary" type="submit">{t('products.search')}</button></form>
    {data.length === 0 ? <p className="rounded-xl border border-slate-300 p-6">{t('products.empty')}</p> :
      <ul className="grid gap-3">{data.map((product) => { const asset = assetMap.get(photos.get(product.id) ?? '');
        const price = prices.get(product.id);
        return <li key={product.id} className="flex min-h-24 items-center gap-4 rounded-xl border border-slate-300 p-3">
          {asset && <img className="h-20 w-20 rounded-lg object-cover" alt={asset.alt_text ?? ''}
            src={`${base}/storage/v1/object/public/store-media/${asset.path.split('/').map(encodeURIComponent).join('/')}`} />}
          <div className="min-w-0"><strong>{product.name}</strong><p>{product.status === 'active' ? t('products.active') : t('products.draft')}</p>
            {price != null && store.data && <p>{formatMoney({ amount: BigInt(price), currency: store.data.currency as CurrencyCode }, store.data.default_locale)}</p>}</div>
          <p>{t('products.stock')}: {stock.get(variantByProduct.get(product.id) ?? '') ?? 0}</p>
          <a className="ml-auto inline-flex min-h-11 items-center" href={`/products/${product.id}?store=${storeId}`}>{t('products.stock')}</a>
        </li>; })}</ul>}
  </main></PanelShell>;
}
