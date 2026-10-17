import { notFound } from 'next/navigation';
import { listProducts } from '../../../../lib/catalog';
import { catalogLabels, catalogStore, ProductCards } from '../../../../lib/catalog-ui';

export default async function SearchPage({ params, searchParams }: { params: Promise<{ storeId: string }>;
  searchParams: Promise<{ q?: string; sort?: string }> }) {
  const { storeId } = await params;
  const store = await catalogStore(storeId);
  if (!store) notFound();
  const input = await searchParams;
  const labels = catalogLabels(store.default_locale);
  const products = await listProducts(storeId, input);
  return <main className="mx-auto max-w-6xl space-y-6 p-4">
    <h1 className="text-3xl font-bold">{labels.search}</h1>
    <form className="flex flex-wrap gap-3" role="search">
      <input name="q" defaultValue={input.q ?? ''} aria-label={labels.search} maxLength={80}
        className="min-h-11 min-w-0 flex-1 rounded border p-3 text-base" />
      <select name="sort" defaultValue={input.sort ?? 'newest'} aria-label={labels.sort} className="min-h-11 rounded border p-2">
        <option value="newest">{labels.newest}</option><option value="name">{labels.name}</option>
        <option value="price">{labels.priceLow}</option>
      </select>
      <button className="min-h-11 rounded bg-slate-900 px-5 text-white">{labels.searchButton}</button>
    </form>
    <ProductCards products={products} store={store} />
  </main>;
}
