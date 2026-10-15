import { describe, expect, it } from 'vitest';
import { calculateTotals } from './orders';

const usd = (amount: bigint) => ({ amount, currency: 'USD' as const });

describe('order totals', () => {
  it('matches database checks for lines and total', () => {
    const totals = calculateTotals({
      items: [{ unitPrice: usd(125n), quantity: 2 }],
      shippingMethod: { kind: 'fixed', amount: usd(50n) },
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
        shippingMethod: { kind: 'fixed', amount: usd(100n), freeFrom: usd(1000n) },
      }).shipping.amount,
    ).toBe(0n);
    expect(
      calculateTotals({
        items: [{ unitPrice: usd(999n), quantity: 1 }],
        shippingMethod: { kind: 'fixed', amount: usd(100n), freeFrom: usd(1000n) },
      }).shipping.amount,
    ).toBe(100n);
    expect(
      calculateTotals({
        items: [{ unitPrice: usd(1n), quantity: 1 }],
        shippingMethod: { kind: 'pickup' },
      }).shipping.amount,
    ).toBe(0n);
  });
  it('rejects invalid items, currencies and discounts', () => {
    expect(() => calculateTotals({ items: [], shippingMethod: { kind: 'pickup' } })).toThrow();
    expect(() =>
      calculateTotals({
        items: [{ unitPrice: usd(1n), quantity: 0 }],
        shippingMethod: { kind: 'pickup' },
      }),
    ).toThrow();
    expect(() =>
      calculateTotals({
        items: [{ unitPrice: usd(-1n), quantity: 1 }],
        shippingMethod: { kind: 'pickup' },
      }),
    ).toThrow();
    expect(() =>
      calculateTotals({
        items: [{ unitPrice: usd(1n), quantity: 1 }],
        shippingMethod: { kind: 'fixed', amount: usd(-1n) },
      }),
    ).toThrow();
    expect(() =>
      calculateTotals({
        items: [{ unitPrice: usd(1n), quantity: 1 }],
        shippingMethod: { kind: 'pickup' },
        discount: usd(2n),
      }),
    ).toThrow();
    expect(() =>
      calculateTotals({
        items: [{ unitPrice: usd(1n), quantity: 1 }],
        shippingMethod: { kind: 'fixed', amount: { amount: 1n, currency: 'ARS' } },
      }),
    ).toThrow();
  });
});
