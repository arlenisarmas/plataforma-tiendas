import { addMoney, multiplyMoney, subtractMoney, type Money } from './money';

export type OrderItem = { unitPrice: Money; quantity: number };
/** Mismos tipos que el enum `shipping_kind` de la base de datos. */
export type ShippingKind = 'pickup' | 'flat_rate' | 'local_delivery';

/**
 * Refleja una fila de `shipping_methods`: `price` = `price_amount`,
 * `freeOver` = `free_over_amount` (envío gratis desde ese subtotal).
 */
export type ShippingMethod = { kind: ShippingKind; price: Money; freeOver?: Money };

export type TotalsInput = {
  items: readonly OrderItem[];
  shippingMethod: ShippingMethod;
  discount?: Money;
};

export function calculateTotals({ items, shippingMethod, discount }: TotalsInput): {
  subtotal: Money;
  shipping: Money;
  discount: Money;
  total: Money;
} {
  const first = items[0];
  if (!first) throw new RangeError('An order must have at least one item');
  const currency = first.unitPrice.currency;
  let subtotal: Money = { amount: 0n, currency };
  for (const item of items) {
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.unitPrice.amount < 0n)
      throw new RangeError('Invalid order item');
    subtotal = addMoney(subtotal, multiplyMoney(item.unitPrice, item.quantity));
  }
  const price = addMoney({ amount: 0n, currency }, shippingMethod.price);
  if (price.amount < 0n) throw new RangeError('Invalid shipping price');
  let shipping: Money = price;
  if (shippingMethod.freeOver) {
    const threshold = addMoney({ amount: 0n, currency }, shippingMethod.freeOver);
    if (threshold.amount <= 0n) throw new RangeError('Invalid free shipping threshold');
    if (subtotal.amount >= threshold.amount) shipping = { amount: 0n, currency };
  }
  const appliedDiscount = discount
    ? addMoney({ amount: 0n, currency }, discount)
    : { amount: 0n, currency };
  if (appliedDiscount.amount < 0n || appliedDiscount.amount > subtotal.amount + shipping.amount)
    throw new RangeError('Invalid discount');
  return {
    subtotal,
    shipping,
    discount: appliedDiscount,
    total: subtractMoney(addMoney(subtotal, shipping), appliedDiscount),
  };
}
