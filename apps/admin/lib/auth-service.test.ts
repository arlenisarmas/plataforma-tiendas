import { describe, expect, it, vi } from 'vitest';
import type { UserClient } from '@plataforma/db';
import { chooseGuide, credentialsSchema, profileSchema, saveProfile, sendMagicLink, signIn } from './auth-service';

describe('admin auth service', () => {
  it('rejects invalid credentials before calling Supabase', async () => {
    const auth = { signInWithPassword: vi.fn() };
    await expect(signIn({ auth } as unknown as UserClient, { email: 'bad', password: '123' })).rejects.toThrow();
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
    expect(credentialsSchema.safeParse({ email: 'ok@example.com', password: '12345678' }).success).toBe(true);
  });

  it('uses the user client for login and magic link without creating an account', async () => {
    const auth = { signInWithPassword: vi.fn().mockResolvedValue({ error: null }), signInWithOtp: vi.fn().mockResolvedValue({ error: null }) };
    const client = { auth } as unknown as UserClient;
    await signIn(client, { email: 'ok@example.com', password: '12345678' });
    await sendMagicLink(client, { email: 'ok@example.com' }, 'https://admin.example.com/auth/callback');
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: 'ok@example.com', password: '12345678' });
    expect(auth.signInWithOtp).toHaveBeenCalledWith({ email: 'ok@example.com', options: {
      emailRedirectTo: 'https://admin.example.com/auth/callback', shouldCreateUser: false,
    } });
  });

  it('validates preferences and scopes writes to the current user', async () => {
    const single = vi.fn().mockResolvedValue({ error: null });
    const eq = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) });
    const update = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ update });
    const client = { from } as unknown as UserClient;
    await saveProfile(client, 'user-1', { fullName: 'Ana', textScale: '150', uiMode: 'simple', locale: 'es-AR' });
    expect(from).toHaveBeenCalledWith('profiles');
    expect(eq).toHaveBeenCalledWith('id', 'user-1');
    expect(update).toHaveBeenCalledWith({ full_name: 'Ana', text_scale: 150, ui_mode: 'simple', locale: 'es-AR' });
    await chooseGuide(client, 'user-1', false);
    expect(update).toHaveBeenCalledWith({ guided: false });
    expect(profileSchema.safeParse({ fullName: '', textScale: 200, uiMode: 'simple', locale: 'en' }).success).toBe(false);
  });
});
