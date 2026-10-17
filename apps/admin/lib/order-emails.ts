import { z } from 'zod';
import type { UserClient } from '@plataforma/db';
import { deliverEmail } from '@plataforma/emails';
import { defaultLocale, isLocale, messages } from '@plataforma/i18n';

export type OrderUpdate = 'paid' | 'shipped' | 'ready_for_pickup';

const orderSchema = z.object({ number: z.number(), email: z.email(), locale: z.string(),
  stores: z.object({ name: z.string() }) });

/**
 * Tells the buyer about a payment confirmation or shipment. Runs after the change is saved
 * (via `after()`), never throws, and is idempotent per order and update.
 */
export async function sendOrderUpdateEmail(client: UserClient, storeId: string, orderId: string,
  update: OrderUpdate): Promise<void> {
  try {
    const { data } = await client.from('orders').select('number,email,locale,stores(name)')
      .eq('store_id', storeId).eq('id', orderId).single();
    const order = orderSchema.safeParse(data);
    if (!order.success) return;
    const locale = isLocale(order.data.locale) ? order.data.locale : defaultLocale;
    await deliverEmail({ to: order.data.email, idempotencyKey: `order/${orderId}/${update}`, data: {
      kind: update === 'paid' ? 'paymentConfirmed' : 'orderReady', pickup: update === 'ready_for_pickup',
      copy: messages[locale].emails, storeName: order.data.stores.name, orderNumber: order.data.number } });
  } catch {
    console.error('Order update email failed', { orderId });
  }
}
