'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { userClient } from '../lib/server-client';
import { chooseGuide, saveProfile, sendMagicLink, sendPasswordReset, signIn, signUp } from '../lib/auth-service';

function origin() { return process.env.NEXT_PUBLIC_ADMIN_URL ?? 'http://localhost:3001'; }
function fields(form: FormData) { return Object.fromEntries(form.entries()); }
function authError(): never { redirect('/login?error=1'); }
function safeInvitationPath(value: FormDataEntryValue | null): string | null {
  const parsed = z.string().regex(/^\/invite\/[A-Za-z0-9_-]{32,100}$/).safeParse(value);
  return parsed.success ? parsed.data : null;
}

export async function loginAction(form: FormData) {
  const client = await userClient();
  const result = await signIn(client, fields(form)).catch(authError);
  if (result.error) authError();
  const userId = result.data.user.id;
  const { data: profile } = await client.from('profiles').select('text_scale,locale').eq('id', userId).single();
  const store = await cookies();
  if (profile) {
    store.set('text-scale', String(profile.text_scale), { path: '/', sameSite: 'lax' });
    store.set('admin-locale', profile.locale, { path: '/', sameSite: 'lax' });
  }
  redirect(safeInvitationPath(form.get('next')) ?? '/');
}

export async function signupAction(form: FormData) {
  const result = await signUp(await userClient(), fields(form), `${origin()}/auth/callback?first=1`).catch(authError);
  if (result.error) authError();
  redirect(result.data.session ? '/welcome' : '/login?sent=1');
}

export async function magicAction(form: FormData) {
  const next = safeInvitationPath(form.get('next'));
  const callback = new URL(`${origin()}/auth/callback`);
  if (next) callback.searchParams.set('next', next);
  const result = await sendMagicLink(await userClient(), fields(form), callback.toString()).catch(authError);
  if (result.error) authError();
  redirect('/login?sent=1');
}

export async function forgotAction(form: FormData) {
  await sendPasswordReset(await userClient(), fields(form), `${origin()}/auth/callback?next=/reset/new`).catch(authError);
  redirect('/login?sent=1');
}

export async function resetAction(form: FormData) {
  const password = z.string().min(8).max(128).parse(form.get('password'));
  const client = await userClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) authError();
  const { error } = await client.auth.updateUser({ password });
  if (error) authError();
  redirect('/profile?updated=1');
}

export async function guideAction(form: FormData) {
  const guided = z.enum(['yes', 'no']).parse(form.get('guided')) === 'yes';
  const client = await userClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) authError();
  const { error } = await chooseGuide(client, user.id, guided);
  if (error) redirect('/welcome?error=1');
  redirect('/');
}

export async function profileAction(form: FormData) {
  const client = await userClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) authError();
  const values = { fullName: form.get('fullName'), textScale: form.get('textScale'),
    uiMode: form.get('uiMode'), locale: form.get('locale') };
  const parsed = z.object({ fullName: z.string(), textScale: z.string(), uiMode: z.string(), locale: z.string() }).safeParse(values);
  if (!parsed.success) redirect('/profile?error=1');
  const { error } = await saveProfile(client, user.id, parsed.data).catch(() => redirect('/profile?error=1'));
  if (error) redirect('/profile?error=1');
  (await cookies()).set('text-scale', parsed.data.textScale, { path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  (await cookies()).set('admin-locale', parsed.data.locale, { path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  redirect('/profile?updated=1');
}

export async function logoutAction() {
  await (await userClient()).auth.signOut();
  const store = await cookies();
  store.delete('text-scale');
  store.delete('admin-locale');
  redirect('/login');
}
