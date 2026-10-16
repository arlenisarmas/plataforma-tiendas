import { describe, expect, it } from 'vitest';
import { nextOrderStatuses } from './order-status';

describe('order transitions shown to a seller', () => {
  it('offers shipping only for delivery orders', () => {
    expect(nextOrderStatuses('paid', 'flat_rate')).toEqual(['preparing', 'shipped', 'cancelled']);
    expect(nextOrderStatuses('paid', 'pickup')).toEqual(['preparing', 'ready_for_pickup', 'cancelled']);
  });
  it('never offers a transition from a final state', () => {
    expect(nextOrderStatuses('delivered', 'pickup')).toEqual([]);
    expect(nextOrderStatuses('cancelled', 'flat_rate')).toEqual([]);
  });
});
