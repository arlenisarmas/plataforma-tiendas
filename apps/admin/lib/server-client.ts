import { cookies } from 'next/headers';
import { createServerClient } from '@plataforma/db';

export async function userClient() {
  const store = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing public Supabase settings');
  return createServerClient(url, key, {
    getAll: () => store.getAll(),
    setAll: (updates) => { for (const { name, value, options } of updates) store.set(name, value, options); },
  });
}
