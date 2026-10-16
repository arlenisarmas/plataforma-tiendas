import { redirect } from 'next/navigation';
import { z } from 'zod';
import { userClient } from './server-client';
import { checklistState } from './checklist';

const storeSchema = z.object({ id: z.uuid(), name: z.string(), slug: z.string(), status: z.string(),
  logo_asset_id: z.uuid().nullable(), timezone: z.string() });
const notificationSchema = z.object({ id: z.uuid(), title: z.string(), body: z.string().nullable(),
  link: z.string().nullable(), read_at: z.string().nullable(), created_at: z.string() });

export async function panelContext(requested?: string) {
  const client = await userClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect('/login');
  const { data: memberships, error } = await client.from('store_members').select('store_id').eq('user_id', user.id);
  if (error) throw error;
  const ids = (memberships ?? []).map((item) => item.store_id);
  if (ids.length === 0) redirect('/stores/new');
  const { data, error: storesError } = await client.from('stores').select('id,name,slug,status,logo_asset_id,timezone').in('id', ids).order('name');
  if (storesError) throw storesError;
  const stores = z.array(storeSchema).parse(data);
  if (stores.length === 0) redirect('/stores/new');
  const selected = stores.find((item) => item.id === requested) ?? stores[0];
  if (!selected) redirect('/stores/new');
  return { client, userId: user.id, stores, selected };
}

export async function dashboardData(requested?: string) {
  const context = await panelContext(requested);
  const { client, selected, userId } = context;
  const [products, payments, shipping, pages, orders, alerts] = await Promise.all([
    client.from('products').select('id', { count: 'exact', head: true }).eq('store_id', selected.id),
    client.from('store_payment_methods').select('id', { count: 'exact', head: true }).eq('store_id', selected.id).eq('is_enabled', true),
    client.from('shipping_methods').select('id', { count: 'exact', head: true }).eq('store_id', selected.id).eq('is_active', true),
    client.from('pages').select('id', { count: 'exact', head: true }).eq('store_id', selected.id).eq('kind', 'home').not('published_version_id', 'is', null),
    client.from('orders').select('placed_at').eq('store_id', selected.id).gte('placed_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()),
    client.from('notifications').select('id,title,body,link,read_at,created_at').eq('user_id', userId).eq('store_id', selected.id).order('created_at', { ascending: false }).limit(20),
  ]);
  const failure = [products, payments, shipping, pages, orders, alerts].find((result) => result.error)?.error;
  if (failure) throw failure;
  const day = (value: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: selected.timezone,
    year: 'numeric', month: '2-digit', day: '2-digit' }).format(value);
  const today = day(new Date());
  return { ...context, checks: checklistState({ hasLogo: Boolean(selected.logo_asset_id), products: products.count ?? 0,
    payments: payments.count ?? 0, shipping: shipping.count ?? 0, pages: pages.count ?? 0,
    published: selected.status === 'published' }),
  ordersToday: (orders.data ?? []).filter((order) => day(new Date(order.placed_at)) === today).length,
  notifications: z.array(notificationSchema).parse(alerts.data), };
}
