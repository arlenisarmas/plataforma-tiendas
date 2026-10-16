import Link from 'next/link';
import { formatMoney } from '@plataforma/core';
import { isLocale, messages } from '@plataforma/i18n';
import { mediaUrl, readStorefront, storeSchema } from './storefront-data';
import type { listProducts } from './catalog';

export async function catalogStore(storeId: string) {
  return (await readStorefront('stores', storeSchema, { id: `eq.${storeId}`, limit: '1' }, [`store:${storeId}`]))[0];
}

export function catalogLabels(locale: string) {
  return messages[isLocale(locale) ? locale : 'es-419'].storefront.catalog;
}

export function ProductCards({ products, store }: { products: Awaited<ReturnType<typeof listProducts>>;
  store: NonNullable<Awaited<ReturnType<typeof catalogStore>>> }) {
  const labels = catalogLabels(store.default_locale);
  if (!products.length) return <p className="rounded-xl border p-6">{labels.empty}</p>;
  return <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">{products.map((product) => <li key={product.id}>
    <Link className="block rounded-xl border p-3 focus-visible:outline-2" href={`/producto/${product.slug}`}>
      {product.image && <img src={mediaUrl(product.image.path)} alt={product.image.alt_text ?? product.name}
        width={400} height={400} loading="lazy" className="aspect-square w-full rounded-lg object-cover" />}
      <h2 className="mt-3 text-lg font-semibold">{product.name}</h2>
      {product.price !== null && <p>{formatMoney({ amount: BigInt(product.price), currency: store.currency }, store.default_locale)}</p>}
    </Link>
  </li>)}</ul>;
}
