'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { userClient } from '../lib/server-client';

export async function readNotification(form: FormData) {
  const id = z.uuid().safeParse(form.get('id'));
  if (!id.success) return;
  const client = await userClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect('/login');
  const { error } = await client.from('notifications').update({ read_at: new Date().toISOString() })
    .eq('id', id.data).eq('user_id', user.id);
  if (error) throw error;
  revalidatePath('/');
}
