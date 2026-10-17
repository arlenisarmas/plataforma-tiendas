import { createHash } from 'node:crypto';
// eslint-disable-next-line boundaries/dependencies -- crear la cuenta de una persona invitada requiere service role (solo servidor)
import { createServiceClient } from '@plataforma/db/server';
import { userClient } from './server-client';

export type InvitationKind = 'platform' | 'store';
export const tokenPattern = /^[A-Za-z0-9_-]{32,100}$/;

function service() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key);
}

/** Email al que va dirigida una invitación vigente (sin exponer nada más). */
export async function invitationEmail(kind: InvitationKind, token: string): Promise<{ email: string; fullName: string | null } | null> {
  if (!tokenPattern.test(token)) return null;
  if (kind === 'platform') {
    const { data } = await (await userClient()).rpc('check_platform_invitation', { p_token: token });
    const row = data?.[0];
    return row ? { email: row.email, fullName: row.full_name ?? null } : null;
  }
  const client = service();
  if (!client) return null;
  const hash = createHash('sha256').update(token).digest('hex');
  const { data } = await client.from('store_invitations').select('email,expires_at,accepted_at').eq('token_hash', hash).maybeSingle();
  if (!data || data.accepted_at || new Date(data.expires_at) < new Date()) return null;
  return { email: String(data.email).toLowerCase(), fullName: null };
}

/**
 * Crea la cuenta de la persona invitada con el email ya confirmado: el enlace llegó a ese correo,
 * así que la invitación prueba que es suyo. Devuelve 'exists' si ya tenía cuenta.
 */
export async function createInvitedAccount(email: string, password: string, fullName: string): Promise<'created' | 'exists' | 'error'> {
  const client = service();
  if (!client) return 'error';
  const { error } = await client.auth.admin.createUser({ email, password, email_confirm: true,
    user_metadata: fullName ? { full_name: fullName } : {} });
  if (!error) return 'created';
  return /already|registered|exists/i.test(error.message) ? 'exists' : 'error';
}
