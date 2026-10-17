import type { BlockDefinition } from '../types';
import { thumbnailFor } from '../thumbnail';
import { ProductCollection, CategoryGrid } from './component';
import { loadProducts, loadCategories } from './data';
import { featuredProductsSchema, categoryGridSchema, productGridSchema } from './schema';

function variants(type: string, ids: string[]) {
  return ids.map((id) => ({ id, i18n: { name: `blocks.${type}${id[0]?.toUpperCase()}${id.slice(1)}` }, thumbnail: thumbnailFor(type, id) }));
}

async function productData(ctx: Parameters<typeof loadProducts>[0], limit: number, filters?: Record<string, string>) {
  const [{ messages }, items] = await Promise.all([import('@plataforma/i18n'), loadProducts(ctx, limit, filters)]);
  const locale = ctx.locale in messages ? ctx.locale as keyof typeof messages : 'es-419';
  return { items, outOfStockLabel: messages[locale].blocks.outOfStock };
}

export const featuredProductsDefinition = {
  type: 'featured-products', version: 1, category: 'productos', icon: 'star',
  i18n: { name: 'blocks.featuredProducts', description: 'blocks.featuredProductsDescription' },
  schema: featuredProductsSchema, defaults: { title: '', limit: 8 },
  fields: [
    { name: 'title', kind: 'text', i18n: { label: 'blocks.richTextTitle' }, simple: true },
    { name: 'limit', kind: 'number', i18n: { label: 'blocks.productLimit' }, simple: false },
  ],
  variants: variants('featuredProducts', ['grid', 'carousel', 'featured-list']), defaultVariant: 'grid',
  // Si todavía no hay destacados, muestra los últimos productos para que la portada nunca quede vacía.
  loader: async (props, ctx) => {
    const featured = await productData(ctx, props.limit, { is_featured: 'eq.true' });
    return featured.items.length > 0 ? featured : productData(ctx, props.limit);
  }, Component: ProductCollection,
} satisfies BlockDefinition<typeof featuredProductsSchema>;

export const categoryGridDefinition = {
  type: 'category-grid', version: 1, category: 'productos', icon: 'grid',
  i18n: { name: 'blocks.categoryGrid', description: 'blocks.categoryGridDescription' },
  schema: categoryGridSchema, defaults: { title: '', limit: 8 },
  fields: [
    { name: 'title', kind: 'text', i18n: { label: 'blocks.richTextTitle' }, simple: true },
    { name: 'limit', kind: 'number', i18n: { label: 'blocks.categoryLimit' }, simple: false },
  ],
  variants: variants('categoryGrid', ['cards', 'circles', 'image-list']), defaultVariant: 'cards',
  loader: (props, ctx) => loadCategories(ctx, props.limit), Component: CategoryGrid,
} satisfies BlockDefinition<typeof categoryGridSchema>;

export const productGridDefinition = {
  type: 'product-grid', version: 1, category: 'productos', icon: 'layout-grid',
  i18n: { name: 'blocks.productGrid', description: 'blocks.productGridDescription' },
  schema: productGridSchema, defaults: { title: '', limit: 12 },
  fields: [
    { name: 'title', kind: 'text', i18n: { label: 'blocks.richTextTitle' }, simple: true },
    { name: 'categoryId', kind: 'category-picker', i18n: { label: 'blocks.category' }, simple: true },
    { name: 'limit', kind: 'number', i18n: { label: 'blocks.productLimit' }, simple: false },
  ],
  variants: variants('productGrid', ['grid-2', 'grid-3', 'grid-4', 'list']), defaultVariant: 'grid-2',
  loader: (props, ctx) => productData(ctx, props.limit, props.categoryId ? { category_id: `eq.${props.categoryId}` } : {}),
  Component: ProductCollection,
} satisfies BlockDefinition<typeof productGridSchema>;
