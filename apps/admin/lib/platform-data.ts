import { z } from 'zod';
import type { UserClient } from '@plataforma/db';

const overviewSchema = z.object({ stores: z.number(), storesPublished: z.number(), people: z.number(),
  workingNow: z.number(), ordersToday: z.number(), ordersPending: z.number(), invitationsPending: z.number() });
export const personStoresSchema = z.array(z.object({ id: z.uuid(), name: z.string(), role: z.enum(['owner', 'staff']) }));

function must<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}

export async function platformOverview(client: UserClient) {
  return overviewSchema.parse(must(await client.rpc('platform_overview')));
}
export async function platformStores(client: UserClient) {
  return must(await client.rpc('platform_stores')) ?? [];
}
export async function platformPeople(client: UserClient) {
  return (must(await client.rpc('platform_people')) ?? []).map((person) => ({
    ...person, stores: personStoresSchema.catch([]).parse(person.stores) }));
}
export async function platformPresence(client: UserClient) {
  return must(await client.rpc('platform_presence')) ?? [];
}
export async function platformActivity(client: UserClient, options: { limit?: number; offset?: number; store?: string; user?: string } = {}) {
  return must(await client.rpc('platform_activity', { p_limit: options.limit ?? 50, p_offset: options.offset ?? 0,
    ...(options.store ? { p_store: options.store } : {}), ...(options.user ? { p_user: options.user } : {}) })) ?? [];
}
export async function platformWorkHours(client: UserClient, from: string, to: string) {
  return must(await client.rpc('platform_work_hours', { p_from: from, p_to: to })) ?? [];
}
export async function pendingInvitations(client: UserClient) {
  const { data, error } = await client.from('platform_invitations')
    .select('id,email,full_name,can_create_stores,max_stores,store_id,store_role,expires_at,created_at')
    .is('accepted_at', null).is('revoked_at', null).gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Días en la zona de la plataforma (YYYY-MM-DD) para «esta semana» (lunes a domingo) y «este mes». */
export function periodRange(kind: 'week' | 'month', now = new Date()): { from: string; to: string } {
  const today = new Date(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric', month: '2-digit', day: '2-digit' }).format(now) + 'T00:00:00Z');
  const from = new Date(today);
  if (kind === 'week') from.setUTCDate(today.getUTCDate() - ((today.getUTCDay() + 6) % 7));
  else from.setUTCDate(1);
  const iso = (value: Date) => value.toISOString().slice(0, 10);
  return { from: iso(from), to: iso(today) };
}

export function minutesLabel(total: number): { hours: number; minutes: number } {
  return { hours: Math.floor(total / 60), minutes: total % 60 };
}
