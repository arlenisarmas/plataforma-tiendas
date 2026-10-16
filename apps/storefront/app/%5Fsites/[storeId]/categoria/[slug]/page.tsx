import Link from 'next/link';
import { notFound } from 'next/navigation';
import { categories, listProducts } from '../../../../../lib/catalog';
import { catalogLabels, catalogStore, ProductCards } from '../../../../../lib/catalog-ui';

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ storeId: string; slug: string }>;
  searchParams: Promise<{ sort?: string; subcategory?: string }> }) {
  const { storeId, slug } = await params;
  const [store, all] = await Promise.all([catalogStore(storeId), categories(storeId)]);
  if (!store) notFound();
  const category = all.find((item) => item.slug === slug);
  if (!category) notFound();
  const input = await searchParams;
  const children = all.filter((item) => item.parent_id === category.id);
  const chosen = children.find((item) => item.id === input.subcategory);
  const labels = catalogLabels(store.default_locale);
  const products = await listProducts(storeId, { category: chosen?.id ?? category.id, sort: input.sort });
  return <main className="mx-auto max-w-6xl space-y-6 p-4">
    <h1 className="text-3xl font-bold">{category.name}</h1>
    {category.description && <p>{category.description}</p>}
    <nav className="flex flex-wrap gap-3" aria-label={labels.category}>
      <Link className="min-h-11 rounded border p-3" href={`/categoria/${slug}`}>{labels.all}</Link>
      {children.map((child) => <Link key={child.id} className="min-h-11 rounded border p-3"
        href={`/categoria/${slug}?subcategory=${child.id}`}>{child.name}</Link>)}
    </nav>
    <form><input type="hidden" name="subcategory" value={chosen?.id ?? ''} />
      <label>{labels.sort}<select name="sort" defaultValue={input.sort ?? 'newest'} className="ml-2 min-h-11 rounded border p-2">
        <option value="newest">{labels.newest}</option><option value="name">{labels.name}</option>
        <option value="price">{labels.priceLow}</option></select></label>
      <button className="ml-2 min-h-11 rounded border px-4">{labels.sort}</button>
    </form>
    <ProductCards products={products} store={store} />
  </main>;
}
