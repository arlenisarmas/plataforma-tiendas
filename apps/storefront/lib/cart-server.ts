import { cookies } from 'next/headers';
import { readCart } from './cart';
import { productSchema, readStorefront, variantSchema } from './storefront-data';

export const CART_COOKIE = 'store_cart';

export async function currentCart(storeId: string) {
  return readCart((await cookies()).get(CART_COOKIE)?.value, storeId, process.env.CART_COOKIE_SECRET);
}

export async function cartView(storeId: string) {
  const cart = await currentCart(storeId);
  if (!cart.items.length) return { lines: [], changed: false, total: 0n };
  const productIds = [...new Set(cart.items.map((item) => item.productId))].join(',');
  const variantIds = cart.items.map((item) => item.variantId).join(',');
  const [products, variants] = await Promise.all([
    readStorefront('products', productSchema, { store_id: `eq.${storeId}`, id: `in.(${productIds})` }, [], true),
    readStorefront('variants', variantSchema, { store_id: `eq.${storeId}`, id: `in.(${variantIds})` }, [], true),
  ]);
  let changed = false;
  const lines = cart.items.flatMap((item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    const variant = variants.find((candidate) => candidate.id === item.variantId && candidate.product_id === item.productId);
    if (!product || !variant || !variant.is_available) { changed = true; return []; }
    const quantity = Math.min(item.quantity, variant.available_quantity ?? item.quantity);
    if (quantity !== item.quantity) changed = true;
    if (quantity < 1) return [];
    return [{ productId: product.id, variantId: variant.id, name: product.name, slug: product.slug,
      option: variant.title, quantity, price: BigInt(variant.price_amount) }];
  });
  return { lines, changed, total: lines.reduce((sum, line) => sum + line.price * BigInt(line.quantity), 0n) };
}
