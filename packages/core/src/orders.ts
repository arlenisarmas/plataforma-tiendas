import { addMoney, multiplyMoney, subtractMoney, type Money } from './money';

export type OrderItem = { unitPrice: Money; quantity: number };
export type ShippingMethod =
  { kind: 'pickup' } | { kind: 'fixed'; amount: Money; freeFrom?: Money };

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
  const currency =
    items[0]?.unitPrice.currency ??
    (shippingMethod.kind === 'fixed' ? shippingMethod.amount.currency : discount?.currency);
  if (!currency) throw new RangeError('An order must have at least one item');
  let subtotal: Money = { amount: 0n, currency };
  for (const item of items) {
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.unitPrice.amount < 0n)
      throw new RangeError('Invalid order item');
    subtotal = addMoney(subtotal, multiplyMoney(item.unitPrice, item.quantity));
  }
  let shipping: Money = { amount: 0n, currency };
  if (shippingMethod.kind === 'fixed') {
    if (shippingMethod.amount.amount < 0n) throw new RangeError('Invalid shipping price');
    if (shippingMethod.freeFrom) {
      const threshold = addMoney({ amount: 0n, currency }, shippingMethod.freeFrom);
      if (threshold.amount < 0n) throw new RangeError('Invalid free shipping threshold');
      if (subtotal.amount < threshold.amount) shipping = addMoney(shipping, shippingMethod.amount);
    } else {
      shipping = addMoney(shipping, shippingMethod.amount);
    }
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
