import { z } from 'zod';
import type { UserClient } from '@plataforma/db';

export const credentialsSchema = z.object({ email: z.email().max(254), password: z.string().min(8).max(128) });
export const emailSchema = z.object({ email: z.email().max(254) });
export const profileSchema = z.object({ fullName: z.string().trim().max(100), textScale: z.coerce.number().int().min(100).max(150),
  uiMode: z.enum(['simple', 'advanced']), locale: z.enum(['es-419', 'es-AR', 'en']) });

export async function signIn(client: UserClient, input: unknown) {
  const { email, password } = credentialsSchema.parse(input);
  return client.auth.signInWithPassword({ email, password });
}

export async function signUp(client: UserClient, input: unknown, redirectTo: string) {
  const { email, password } = credentialsSchema.parse(input);
  return client.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } });
}

export async function sendMagicLink(client: UserClient, input: unknown, redirectTo: string) {
  const { email } = emailSchema.parse(input);
  return client.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo, shouldCreateUser: false } });
}

export async function sendPasswordReset(client: UserClient, input: unknown, redirectTo: string) {
  const { email } = emailSchema.parse(input);
  return client.auth.resetPasswordForEmail(email, { redirectTo });
}

export async function saveProfile(client: UserClient, userId: string, input: unknown) {
  const values = profileSchema.parse(input);
  return client.from('profiles').update({ full_name: values.fullName, text_scale: values.textScale,
    ui_mode: values.uiMode, locale: values.locale }).eq('id', userId).select('id').single();
}

export async function chooseGuide(client: UserClient, userId: string, guided: boolean) {
  return client.from('profiles').update({ guided }).eq('id', userId).select('id').single();
}
