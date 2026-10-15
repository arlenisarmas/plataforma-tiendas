import { describe, expect, it } from 'vitest';
import { calculateTotals } from './orders';

const usd = (amount: bigint) => ({ amount, currency: 'USD' as const });
const pickup = { kind: 'pickup' as const, price: usd(0n) };

describe('order totals', () => {
  it('matches database checks for lines and total', () => {
    const totals = calculateTotals({
      items: [{ unitPrice: usd(125n), quantity: 2 }],
      shippingMethod: { kind: 'flat_rate', price: usd(50n) },
      discount: usd(25n),
    });
    expect(totals).toEqual({
      subtotal: usd(250n),
      shipping: usd(50n),
      discount: usd(25n),
      total: usd(275n),
    });
  });
  it('supports free shipping threshold and pickup', () => {
    expect(
      calculateTotals({
        items: [{ unitPrice: usd(1000n), quantity: 1 }],
        shippingMethod: { kind: 'flat_rate', price: usd(100n), freeOver: usd(1000n) },
      }).shipping.amount,
    ).toBe(0n);
    expect(
      calculateTotals({
        items: [{ unitPrice: usd(999n), quantity: 1 }],
        shippingMethod: { kind: 'flat_rate', price: usd(100n), freeOver: usd(1000n) },
      }).shipping.amount,
    ).toBe(100n);
    expect(
      calculateTotals({
        items: [{ unitPrice: usd(1n), quantity: 1 }],
        shippingMethod: pickup,
      }).shipping.amount,
    ).toBe(0n);
  });
  it('requires at least one item even when shipping has a price', () => {
    expect(() =>
      calculateTotals({ items: [], shippingMethod: { kind: 'flat_rate', price: usd(500n) } }),
    ).toThrow();
  });
  it('local delivery charges its price and pickup can be free', () => {
    expect(
      calculateTotals({
        items: [{ unitPrice: usd(10n), quantity: 1 }],
        shippingMethod: { kind: 'local_delivery', price: usd(300n) },
      }).total.amount,
    ).toBe(310n);
  });
  it('rejects a non-positive free shipping threshold', () => {
    expect(() =>
      calculateTotals({
        items: [{ unitPrice: usd(10n), quantity: 1 }],
        shippingMethod: { kind: 'flat_rate', price: usd(100n), freeOver: usd(0n) },
      }),
    ).toThrow();
  });
  it('rejects invalid items, currencies and discounts', () => {
    expect(() => calculateTotals({ items: [], shippingMethod: pickup })).toThrow();
    expect(() =>
      calculateTotals({
        items: [{ unitPrice: usd(1n), quantity: 0 }],
        shippingMethod: pickup,
      }),
    ).toThrow();
    expect(() =>
      calculateTotals({
        items: [{ unitPrice: usd(-1n), quantity: 1 }],
        shippingMethod: pickup,
      }),
    ).toThrow();
    expect(() =>
      calculateTotals({
        items: [{ unitPrice: usd(1n), quantity: 1 }],
        shippingMethod: { kind: 'flat_rate', price: usd(-1n) },
      }),
    ).toThrow();
    expect(() =>
      calculateTotals({
        items: [{ unitPrice: usd(1n), quantity: 1 }],
        shippingMethod: pickup,
        discount: usd(2n),
      }),
    ).toThrow();
    expect(() =>
      calculateTotals({
        items: [{ unitPrice: usd(1n), quantity: 1 }],
        shippingMethod: { kind: 'flat_rate', price: { amount: 1n, currency: 'ARS' } },
      }),
    ).toThrow();
  });
});
