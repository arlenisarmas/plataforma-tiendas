import { z } from 'zod';
import { checklistState } from './checklist';
import type { Viewer } from './viewer';

const storeSchema = z.object({ id: z.uuid(), name: z.string(), slug: z.string(), status: z.string(),
  country_code: z.string(), currency: z.string(), logo_asset_id: z.uuid().nullable(), updated_at: z.string() });

export type SpaceProject = z.infer<typeof storeSchema> & {
  role: 'owner' | 'staff'; percent: number; missing: (keyof ReturnType<typeof checklistState>)[];
};

export const checklistOrder = ['page', 'product', 'payment', 'shipping', 'logo', 'publish'] as const;

/** Datos de «Mi espacio»: solo las tiendas, permisos y actividad de la propia persona. */
export async function mySpaceData(viewer: Viewer) {
  const { client, userId } = viewer;
  const [memberships, profile, recent] = await Promise.all([
    client.from('store_members').select('store_id,role').eq('user_id', userId),
    client.from('profiles').select('full_name,locale,text_scale').eq('id', userId).single(),
    client.from('audit_log').select('id,action,store_id,created_at').eq('actor_id', userId)
      .order('created_at', { ascending: false }).limit(5),
  ]);
  if (memberships.error) throw memberships.error;
  const roles = new Map((memberships.data ?? []).map((item) => [item.store_id, item.role]));
  const ids = [...roles.keys()];
  const stores = ids.length === 0 ? [] : z.array(storeSchema).parse((await client.from('stores')
    .select('id,name,slug,status,country_code,currency,logo_asset_id,updated_at').in('id', ids)
    .order('updated_at', { ascending: false })).data ?? []);
  const projects: SpaceProject[] = await Promise.all(stores.map(async (store) => {
    const [products, payments, shipping, pages] = await Promise.all([
      client.from('products').select('id', { count: 'exact', head: true }).eq('store_id', store.id).eq('status', 'active'),
      client.from('store_payment_methods').select('id', { count: 'exact', head: true }).eq('store_id', store.id).eq('is_enabled', true),
      client.from('shipping_methods').select('id', { count: 'exact', head: true }).eq('store_id', store.id).eq('is_active', true),
      client.from('pages').select('id', { count: 'exact', head: true }).eq('store_id', store.id).eq('kind', 'home')
        .not('published_version_id', 'is', null),
    ]);
    const checks = checklistState({ hasLogo: Boolean(store.logo_asset_id), products: products.count ?? 0,
      payments: payments.count ?? 0, shipping: shipping.count ?? 0, pages: pages.count ?? 0,
      published: store.status === 'published' });
    const done = Object.values(checks).filter(Boolean).length;
    return { ...store, role: roles.get(store.id) === 'owner' ? 'owner' : 'staff',
      percent: Math.round((done / Object.keys(checks).length) * 100),
      missing: checklistOrder.filter((key) => !checks[key]) };
  }));
  const names = new Map(stores.map((store) => [store.id, store.name]));
  const owned = projects.filter((project) => project.role === 'owner').length;
  return {
    projects, owned,
    profile: profile.data ?? { full_name: null, locale: 'es-419', text_scale: 100 },
    recent: (recent.data ?? []).map((item) => ({ ...item, storeName: item.store_id ? names.get(item.store_id) ?? null : null })),
  };
}

/** «store.created» → «store_created» (las claves de i18n no admiten puntos). */
export function activityKey(action: string): string {
  return action.replace(/\./g, '_');
}
