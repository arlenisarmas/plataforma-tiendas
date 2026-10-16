'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { panelContext } from '../../lib/panel-data';
import { nextOrderStatuses } from '../../lib/order-status';

const base = z.object({ storeId: z.uuid(), orderId: z.uuid() });

export async function changeOrderStatus(raw: unknown) {
  const input = base.extend({ status: z.enum(['preparing', 'ready_for_pickup', 'shipped', 'delivered', 'cancelled']) }).safeParse(raw);
  if (!input.success) return { error: 'invalid' as const };
  const context = await panelContext(input.data.storeId);
  if (context.selected.id !== input.data.storeId) return { error: 'permission' as const };
  const { data: order } = await context.client.from('orders').select('status,shipping_snapshot')
    .eq('store_id', input.data.storeId).eq('id', input.data.orderId).single();
  if (!order) return { error: 'missing' as const };
  const kind = z.object({ kind: z.string() }).safeParse(order.shipping_snapshot);
  if (!nextOrderStatuses(order.status, kind.success ? kind.data.kind : undefined).includes(input.data.status))
    return { error: 'invalid' as const };
  const { data, error } = await context.client.from('orders').update({ status: input.data.status })
    .eq('store_id', input.data.storeId).eq('id', input.data.orderId).eq('status', order.status).select('id').single();
  if (error || !data) return { error: 'save' as const };
  revalidatePath('/orders');
  revalidatePath(`/orders/${input.data.orderId}`);
  return {};
}

export async function saveOrderNote(raw: unknown) {
  const input = base.extend({ note: z.string().trim().max(2000) }).safeParse(raw);
  if (!input.success) return { error: 'invalid' as const };
  const context = await panelContext(input.data.storeId);
  if (context.selected.id !== input.data.storeId) return { error: 'permission' as const };
  const { data, error } = await context.client.from('orders').update({ internal_note: input.data.note })
    .eq('store_id', input.data.storeId).eq('id', input.data.orderId).select('id').single();
  if (error || !data) return { error: 'save' as const };
  revalidatePath(`/orders/${input.data.orderId}`);
  return {};
}

export async function decideManualPayment(raw: unknown) {
  const input = base.extend({ paymentId: z.uuid(), approve: z.boolean() }).safeParse(raw);
  if (!input.success) return { error: 'invalid' as const };
  const context = await panelContext(input.data.storeId);
  if (context.selected.id !== input.data.storeId) return { error: 'permission' as const };
  const { data: payment } = await context.client.from('payments').select('id,status,provider')
    .eq('store_id', input.data.storeId).eq('order_id', input.data.orderId).eq('id', input.data.paymentId).single();
  if (!payment || payment.provider !== 'manual' || !['pending', 'in_review'].includes(payment.status))
    return { error: 'invalid' as const };
  const { error } = await context.client.rpc('confirm_manual_payment', {
    p_payment_id: input.data.paymentId, p_approve: input.data.approve });
  if (error) return { error: 'save' as const };
  revalidatePath('/orders');
  revalidatePath(`/orders/${input.data.orderId}`);
  return {};
}
