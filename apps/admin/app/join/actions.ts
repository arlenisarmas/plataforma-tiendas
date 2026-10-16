'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { allowAction } from '../../lib/action-rate-limit';
import { createInvitedAccount, invitationEmail, tokenPattern, type InvitationKind } from '../../lib/join';
import { userClient } from '../../lib/server-client';

const kindSchema = z.enum(['platform', 'store']);

async function acceptAndGo(kind: InvitationKind, token: string): Promise<never> {
  const client = await userClient();
  const result = kind === 'platform'
    ? await client.rpc('accept_platform_invitation', { p_token: token })
    : await client.rpc('accept_store_invitation', { p_token: token });
  if (result.error) redirect(`${kind === 'platform' ? '/join' : '/invite'}/${token}?error=1`);
  redirect(result.data ? (kind === 'platform' ? `/build?store=${result.data}` : `/?store=${result.data}`) : '/');
}

export type JoinState = { error?: 'invalid' | 'exists' | 'failed' | 'rate' };

/** Persona invitada sin cuenta: elige contraseña, se crea la cuenta y se acepta la invitación. */
export async function joinWithPassword(_: JoinState, form: FormData): Promise<JoinState> {
  if (!await allowAction('join', 5, 600_000)) return { error: 'rate' };
  const input = z.object({ kind: kindSchema, token: z.string().regex(tokenPattern), fullName: z.string().trim().max(120).default(''),
    password: z.string().min(8).max(128) }).safeParse(Object.fromEntries(form.entries()));
  if (!input.success) return { error: 'invalid' };
  const invitation = await invitationEmail(input.data.kind, input.data.token);
  if (!invitation) return { error: 'invalid' };
  const created = await createInvitedAccount(invitation.email, input.data.password, input.data.fullName);
  if (created === 'exists') return { error: 'exists' };
  if (created === 'error') return { error: 'failed' };
  const client = await userClient();
  const signedIn = await client.auth.signInWithPassword({ email: invitation.email, password: input.data.password });
  if (signedIn.error) return { error: 'failed' };
  if (input.data.fullName) await client.from('profiles').update({ full_name: input.data.fullName }).eq('id', signedIn.data.user.id);
  return acceptAndGo(input.data.kind, input.data.token);
}

/** Persona que ya inició sesión con el email invitado. */
export async function acceptJoin(form: FormData): Promise<void> {
  const input = z.object({ kind: kindSchema, token: z.string().regex(tokenPattern) }).safeParse(Object.fromEntries(form.entries()));
  if (!input.success) redirect('/');
  await acceptAndGo(input.data.kind, input.data.token);
}
