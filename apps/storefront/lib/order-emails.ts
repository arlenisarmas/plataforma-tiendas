import { z } from 'zod';
import type { UserClient } from '@plataforma/db';
import { deliverEmail } from '@plataforma/emails';
import { defaultLocale, isLocale, messages } from '@plataforma/i18n';

const storeSchema = z.object({ name: z.string(), default_locale: z.string(),
  contact: z.object({ email: z.email().optional() }).loose().nullable() });

export type NewOrderEmails = { storeId: string; orderId: string; orderNumber: number; buyerEmail: string;
  buyerName: string; orderUrl: string; paymentInstructions?: string };

/**
 * Confirmation for the buyer and "new order" notice for the store. Runs after the order is
 * committed (via `after()`), so a slow or failed email never affects the purchase.
 */
export async function sendNewOrderEmails(client: UserClient, order: NewOrderEmails): Promise<void> {
  try {
    const { data } = await client.from('stores').select('name,default_locale,contact').eq('id', order.storeId).single();
    const store = storeSchema.safeParse(data);
    if (!store.success) return;
    const locale = isLocale(store.data.default_locale) ? store.data.default_locale : defaultLocale;
    const base = { copy: messages[locale].emails, storeName: store.data.name, orderNumber: order.orderNumber };
    await deliverEmail({ to: order.buyerEmail, idempotencyKey: `order/${order.orderId}/confirmation`,
      data: { ...base, kind: 'orderConfirmation', orderUrl: order.orderUrl, recipientName: order.buyerName,
        ...(order.paymentInstructions ? { paymentInstructions: order.paymentInstructions } : {}) } });
    const owner = store.data.contact?.email;
    if (owner) await deliverEmail({ to: owner, idempotencyKey: `order/${order.orderId}/new-order`,
      data: { ...base, kind: 'newOrder' } });
  } catch {
    console.error('Order emails failed', { orderId: order.orderId });
  }
}

/** Plain-text payment instructions for manual methods ("alias: che.peludos"). */
export function instructionsText(instructions: Record<string, string>): string {
  return Object.entries(instructions).map(([label, value]) => `${label}: ${value}`).join('\n');
}

const paidOrderSchema = z.object({ number: z.number(), email: z.email(), locale: z.string(),
  stores: z.object({ name: z.string() }) });

/** "Payment confirmed" for the buyer after an approved Mercado Pago notification. Never throws. */
export async function sendPaymentConfirmedEmail(client: UserClient, storeId: string, orderId: string): Promise<void> {
  try {
    const { data } = await client.from('orders').select('number,email,locale,stores(name)')
      .eq('store_id', storeId).eq('id', orderId).single();
    const order = paidOrderSchema.safeParse(data);
    if (!order.success) return;
    const locale = isLocale(order.data.locale) ? order.data.locale : defaultLocale;
    await deliverEmail({ to: order.data.email, idempotencyKey: `order/${orderId}/paid`, data: {
      kind: 'paymentConfirmed', copy: messages[locale].emails, storeName: order.data.stores.name,
      orderNumber: order.data.number } });
  } catch {
    console.error('Payment email failed', { orderId });
  }
}
