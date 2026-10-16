'use server';

import { createHash, randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { slugify } from '@plataforma/core';
import { deliverEmail } from '@plataforma/emails';
import { messages } from '@plataforma/i18n';
import { adminLocale } from '../../lib/locale';
import { currentViewer } from '../../lib/viewer';
import { countryCodes, countryDefaults } from '../../lib/store-setup';
import { allowAction } from '../../lib/action-rate-limit';
import { createStoreAction } from '../stores/new/actions';

async function admin() {
  const viewer = await currentViewer();
  if (!viewer.isAdmin) throw new Error('forbidden');
  return viewer;
}

export async function setStoreSuspended(form: FormData) {
  const input = z.object({ storeId: z.uuid(), suspended: z.enum(['true', 'false']) })
    .safeParse(Object.fromEntries(form.entries()));
  if (!input.success) return;
  const viewer = await admin();
  await viewer.client.rpc('set_store_suspended', { p_store: input.data.storeId, p_suspended: input.data.suspended === 'true' });
  revalidatePath('/platform');
  revalidatePath('/platform/stores');
}

export async function savePermissions(raw: unknown): Promise<{ error?: 'invalid' | 'save' }> {
  const input = z.object({ userId: z.uuid(), canCreate: z.boolean(), maxStores: z.number().int().min(0).max(50),
    paused: z.boolean() }).safeParse(raw);
  if (!input.success) return { error: 'invalid' };
  const viewer = await admin();
  const { error } = await viewer.client.rpc('set_person_permissions', { p_user: input.data.userId,
    p_can_create: input.data.canCreate, p_max_stores: input.data.canCreate ? Math.max(1, input.data.maxStores) : input.data.maxStores,
    p_status: input.data.paused ? 'suspended' : 'active' });
  if (error) return { error: 'save' };
  revalidatePath('/platform/people');
  return {};
}

function newToken() {
  const token = randomBytes(32).toString('base64url');
  return { token, hash: createHash('sha256').update(token).digest('hex') };
}

function joinUrl(token: string) {
  return `${(process.env.NEXT_PUBLIC_ADMIN_URL ?? 'http://localhost:3001').replace(/\/$/, '')}/join/${token}`;
}

async function sendInvitationEmail(email: string, name: string | null, token: string, id: string) {
  const locale = await adminLocale();
  const copy = messages[locale].emails;
  return deliverEmail({ to: email, idempotencyKey: `platform-invitation/${id}/${token.slice(0, 12)}`,
    data: { kind: 'platformInvitation', copy, storeName: messages[locale].admin.login.brand, inviteUrl: joinUrl(token),
      ...(name ? { recipientName: name } : {}) } });
}

const inviteSchema = z.object({
  mode: z.enum(['own', 'help']),
  name: z.string().trim().max(120).optional().default(''),
  email: z.email().max(254),
  maxStores: z.coerce.number().int().min(1).max(50).default(1),
  createNow: z.enum(['on']).optional(),
  storeName: z.string().trim().max(80).optional().default(''),
  country: z.enum(countryCodes).optional(),
  storeId: z.uuid().optional(),
  role: z.enum(['owner', 'staff']).default('staff'),
  alsoCreate: z.enum(['on']).optional(),
});

export type InviteResult = { ok?: { email: string; link: string; delivered: boolean }; error?: 'invalid' | 'store' | 'save' | 'rate' };

export async function createInvitation(_: InviteResult, form: FormData): Promise<InviteResult> {
  if (!await allowAction('platform-invite', 30, 600_000)) return { error: 'rate' };
  const input = inviteSchema.safeParse(Object.fromEntries([...form.entries()].filter(([, value]) => value !== '')));
  if (!input.success) return { error: 'invalid' };
  const viewer = await admin();
  const data = input.data;
  let storeId: string | undefined = data.mode === 'help' ? data.storeId : undefined;
  let storeRole: 'owner' | 'staff' | undefined = data.mode === 'help' ? data.role : undefined;
  if (data.mode === 'help' && !storeId) return { error: 'invalid' };
  if (data.mode === 'own' && data.createNow) {
    if (!data.storeName || !data.country) return { error: 'invalid' };
    const base = slugify(data.storeName).slice(0, 34).replace(/-+$/, '') || 'tienda';
    const created = new FormData();
    for (const [key, value] of Object.entries({ name: data.storeName, slug: `${base}-${randomBytes(2).toString('hex')}`,
      industry: 'general', country: data.country, palette: 'fresco' })) created.set(key, value);
    created.set('locale', countryDefaults[data.country].locale);
    created.set('timezone', countryDefaults[data.country].timezone);
    const result = await createStoreAction(created);
    if (!result.storeId) return { error: 'store' };
    storeId = result.storeId;
    storeRole = 'owner';
  }
  const canCreate = data.mode === 'own' ? !data.createNow || Boolean(data.alsoCreate) : Boolean(data.alsoCreate);
  const { token, hash } = newToken();
  const { data: id, error } = await viewer.client.rpc('create_platform_invitation', {
    p_email: data.email, p_full_name: data.name, p_can_create: canCreate,
    p_max_stores: canCreate ? data.maxStores : 0,
    p_store_id: (storeId ?? null) as string, p_store_role: (storeRole ?? null) as 'owner',
    p_token_hash: hash });
  if (error || !id) return { error: 'save' };
  const delivered = await sendInvitationEmail(data.email.toLowerCase(), data.name || null, token, id);
  revalidatePath('/platform/invite');
  revalidatePath('/platform');
  return { ok: { email: data.email.toLowerCase(), link: joinUrl(token), delivered } };
}

export async function revokeInvitation(form: FormData) {
  const id = z.uuid().safeParse(form.get('id'));
  if (!id.success) return;
  const viewer = await admin();
  await viewer.client.rpc('revoke_platform_invitation', { p_id: id.data });
  revalidatePath('/platform/invite');
}

export async function resendInvitation(_: { link?: string; error?: boolean }, form: FormData): Promise<{ link?: string; error?: boolean }> {
  const input = z.object({ id: z.uuid(), email: z.email(), name: z.string().optional() })
    .safeParse(Object.fromEntries(form.entries()));
  if (!input.success) return { error: true };
  const viewer = await admin();
  const { token, hash } = newToken();
  const { error } = await viewer.client.rpc('renew_platform_invitation', { p_id: input.data.id, p_token_hash: hash });
  if (error) return { error: true };
  await sendInvitationEmail(input.data.email, input.data.name || null, token, input.data.id);
  revalidatePath('/platform/invite');
  return { link: joinUrl(token) };
}
