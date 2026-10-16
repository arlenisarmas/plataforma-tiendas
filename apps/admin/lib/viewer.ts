import { redirect } from 'next/navigation';
import type { UserClient } from '@plataforma/db';
import { userClient } from './server-client';

export type Viewer = {
  client: UserClient;
  userId: string;
  email: string;
  fullName: string | null;
  isAdmin: boolean;
  canCreateStores: boolean;
  maxStores: number;
  status: 'active' | 'suspended';
};

/** Quién está usando el panel. Redirige al ingreso si no hay sesión o si la persona está pausada. */
export async function currentViewer(): Promise<Viewer> {
  const client = await userClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect('/login');
  const [profileResult, adminResult] = await Promise.all([
    client.from('profiles').select('full_name,can_create_stores,max_stores,status').eq('id', user.id).maybeSingle(),
    client.from('platform_admins').select('user_id').eq('user_id', user.id).maybeSingle(),
  ]);
  const profile = profileResult.data;
  const isAdmin = Boolean(adminResult.data);
  const status = profile?.status === 'suspended' && !isAdmin ? 'suspended' : 'active';
  if (status === 'suspended') {
    await client.auth.signOut();
    redirect('/login?paused=1');
  }
  return {
    client, userId: user.id, email: user.email ?? '', fullName: profile?.full_name ?? null, isAdmin,
    canCreateStores: isAdmin || Boolean(profile?.can_create_stores), maxStores: profile?.max_stores ?? 0, status,
  };
}

/** Registra presencia para «Trabajando ahora» y los horarios. Nunca rompe la página. */
export async function touchPresence(client: UserClient, storeId?: string): Promise<void> {
  try { await client.rpc('touch_work_session', storeId ? { p_store: storeId } : {}); } catch { /* presencia opcional */ }
}

export function displayName(viewer: Pick<Viewer, 'fullName' | 'email'>): string {
  return viewer.fullName?.trim() || viewer.email.split('@')[0] || viewer.email;
}
