'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { panelContext } from '../../lib/panel-data';
import { allowAction } from '../../lib/action-rate-limit';

export async function saveCustomerNote(raw: unknown) {
  if (!await allowAction('customer-note', 30, 600_000)) return { error: 'rate' as const };
  const input = z.object({ storeId: z.uuid(), customerId: z.uuid(), note: z.string().trim().max(2000) }).safeParse(raw);
  if (!input.success) return { error: 'invalid' as const };
  const context = await panelContext(input.data.storeId);
  if (context.selected.id !== input.data.storeId) return { error: 'permission' as const };
  const result = await context.client.from('customers').update({ notes: input.data.note })
    .eq('store_id', input.data.storeId).eq('id', input.data.customerId).select('id').single();
  if (result.error || !result.data) return { error: 'save' as const };
  revalidatePath(`/customers/${input.data.customerId}`);
  return {};
}
