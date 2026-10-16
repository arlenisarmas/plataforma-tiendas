'use server';

import { createHash, randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createEmailSender, renderEmail, sendWithRetry } from '@plataforma/emails';
import { messages } from '@plataforma/i18n';
import { adminLocale } from '../../../lib/locale';
import { panelContext } from '../../../lib/panel-data';
import { userClient } from '../../../lib/server-client';
import { allowAction } from '../../../lib/action-rate-limit';

const store = z.object({ storeId: z.uuid() });

async function ownerContext(storeId: string) {
  const context = await panelContext(storeId);
  if (context.selected.id !== storeId) return null;
  const result = await context.client.from('store_members').select('role').eq('store_id', storeId)
    .eq('user_id', context.userId).single();
  return result.data?.role === 'owner' ? context : null;
}

export async function inviteMember(raw: unknown) {
  if (!await allowAction('invite', 10, 600_000)) return { error: 'rate' as const };
  const input = store.extend({ email: z.email(), role: z.enum(['owner', 'staff']) }).safeParse(raw);
  if (!input.success) return { error: 'invalid' as const };
  const context = await ownerContext(input.data.storeId);
  if (!context) return { error: 'permission' as const };
  const baseUrl = process.env.NEXT_PUBLIC_ADMIN_URL;
  if (!baseUrl) return { error: 'config' as const };
  const token = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const result = await context.client.from('store_invitations').insert({ store_id: input.data.storeId,
    email: input.data.email, role: input.data.role, token_hash: tokenHash, invited_by: context.userId });
  if (result.error) return { error: 'save' as const };
  const url = `${baseUrl.replace(/\/$/, '')}/invite/${token}`;
  const locale = await adminLocale();
  const { subject, html } = await renderEmail({ kind: 'teamInvitation', copy: messages[locale].emails,
    storeName: context.selected.name, inviteUrl: url });
  const apiKey = process.env.RESEND_API_KEY && process.env.EMAIL_FROM ? process.env.RESEND_API_KEY : null;
  const sender = createEmailSender(apiKey ? { apiKey } : {});
  const delivered = await sendWithRetry(sender, { to: input.data.email,
    from: process.env.EMAIL_FROM || 'Tienda <noreply@example.test>', subject, html,
    idempotencyKey: `invitation/${tokenHash}` });
  revalidatePath('/customers/team');
  return { url, delivered };
}

export async function changeMemberRole(raw: unknown) {
  const input = store.extend({ userId: z.uuid(), role: z.enum(['owner', 'staff']) }).safeParse(raw);
  if (!input.success) return { error: 'invalid' as const };
  const context = await ownerContext(input.data.storeId);
  if (!context || context.userId === input.data.userId) return { error: 'permission' as const };
  const result = await context.client.from('store_members').update({ role: input.data.role })
    .eq('store_id', input.data.storeId).eq('user_id', input.data.userId).select('user_id').single();
  if (result.error || !result.data) return { error: 'save' as const };
  revalidatePath('/customers/team');
  return {};
}

export async function removeMember(raw: unknown) {
  const input = store.extend({ userId: z.uuid() }).safeParse(raw);
  if (!input.success) return { error: 'invalid' as const };
  const context = await ownerContext(input.data.storeId);
  if (!context || context.userId === input.data.userId) return { error: 'permission' as const };
  const result = await context.client.from('store_members').delete()
    .eq('store_id', input.data.storeId).eq('user_id', input.data.userId).select('user_id').single();
  if (result.error || !result.data) return { error: 'save' as const };
  revalidatePath('/customers/team');
  return {};
}

export async function leaveStore(raw: unknown) {
  const input = store.safeParse(raw);
  if (!input.success) return { error: 'invalid' as const };
  const context = await panelContext(input.data.storeId);
  if (context.selected.id !== input.data.storeId) return { error: 'permission' as const };
  const result = await context.client.from('store_members').delete()
    .eq('store_id', input.data.storeId).eq('user_id', context.userId).select('user_id').single();
  if (result.error || !result.data) return { error: 'save' as const };
  redirect('/');
}

export async function acceptInvitation(raw: unknown) {
  const input = z.object({ token: z.string().min(32).max(100) }).safeParse(raw);
  if (!input.success) return { error: 'invalid' as const };
  const client = await userClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect(`/login?next=/invite/${input.data.token}`);
  const result = await client.rpc('accept_store_invitation', { p_token: input.data.token });
  if (result.error || !result.data) return { error: 'invalid' as const };
  redirect(`/?store=${result.data}`);
}
