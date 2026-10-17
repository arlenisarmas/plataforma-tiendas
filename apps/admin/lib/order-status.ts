export type OrderStatus = 'pending_payment' | 'paid' | 'preparing' | 'ready_for_pickup' |
  'shipped' | 'delivered' | 'cancelled' | 'refunded';

const next: Record<OrderStatus, readonly OrderStatus[]> = {
  pending_payment: ['cancelled'], paid: ['preparing', 'ready_for_pickup', 'shipped', 'cancelled'],
  preparing: ['ready_for_pickup', 'shipped', 'cancelled'],
  ready_for_pickup: ['delivered', 'cancelled'], shipped: ['delivered'],
  delivered: [], cancelled: [], refunded: [],
};

export function nextOrderStatuses(status: OrderStatus, shippingKind?: string): OrderStatus[] {
  return next[status].filter((target) => target !== 'ready_for_pickup' || shippingKind === 'pickup')
    .filter((target) => target !== 'shipped' || shippingKind !== 'pickup');
}
