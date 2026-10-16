import { z } from 'zod';
import { categorySchema, mediaUrl, productImageSchema, productSchema, readStorefront, variantSchema } from './storefront-data';

export const catalogQuerySchema = z.object({ q: z.string().trim().max(80).optional(),
  sort: z.enum(['newest', 'name', 'price']).catch('newest'), category: z.string().uuid().optional() });

export function searchTerm(value: string): string {
  return value.normalize('NFKC').replace(/[^\p{L}\p{N}\s-]/gu, ' ').trim().split(/\s+/).slice(0, 8).join(' & ');
}

export async function listProducts(storeId: string, input: unknown) {
  const query = catalogQuerySchema.parse(input);
  const filters: Record<string, string> = { store_id: `eq.${storeId}`, limit: '60' };
  if (query.category) filters.category_id = `eq.${query.category}`;
  if (query.q && searchTerm(query.q)) filters.search = `fts(simple).${searchTerm(query.q)}`;
  const products = await readStorefront('products', productSchema, filters, [`store:${storeId}`]);
  if (!products.length) return [];
  const ids = products.map((product) => product.id).join(',');
  const [variants, images] = await Promise.all([
    readStorefront('variants', variantSchema, { store_id: `eq.${storeId}`, product_id: `in.(${ids})` }, [`store:${storeId}`]),
    readStorefront('product_images', productImageSchema, { store_id: `eq.${storeId}`, product_id: `in.(${ids})` }, [`store:${storeId}`]),
  ]);
  const cards = products.map((product) => ({ ...product,
    price: variants.filter((variant) => variant.product_id === product.id).reduce<number | null>((lowest, variant) =>
      lowest === null ? variant.price_amount : Math.min(lowest, variant.price_amount), null),
    image: images.filter((image) => image.product_id === product.id).sort((a, b) => a.position - b.position)[0],
  }));
  return cards.sort((a, b) => query.sort === 'name' ? a.name.localeCompare(b.name) :
    query.sort === 'price' ? (a.price ?? Infinity) - (b.price ?? Infinity) :
      b.created_at.localeCompare(a.created_at));
}

export async function productDetail(storeId: string, slug: string) {
  if (!/^[a-z0-9](-?[a-z0-9])*$/.test(slug)) return null;
  const product = (await readStorefront('products', productSchema,
    { store_id: `eq.${storeId}`, slug: `eq.${slug}`, limit: '1' }, [`store:${storeId}`]))[0];
  if (!product) return null;
  const [variants, images] = await Promise.all([
    readStorefront('variants', variantSchema, { store_id: `eq.${storeId}`, product_id: `eq.${product.id}` }, [], true),
    readStorefront('product_images', productImageSchema, { store_id: `eq.${storeId}`, product_id: `eq.${product.id}` }, [`store:${storeId}`]),
  ]);
  return { product, variants: variants.sort((a, b) => a.position - b.position),
    images: images.sort((a, b) => a.position - b.position).map((image) => ({ ...image, url: mediaUrl(image.path) })) };
}

export async function categories(storeId: string) {
  return readStorefront('categories', categorySchema, { store_id: `eq.${storeId}`, order: 'position.asc' }, [`store:${storeId}`]);
}
