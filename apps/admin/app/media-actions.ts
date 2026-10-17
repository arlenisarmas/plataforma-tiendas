'use server';

import { z } from 'zod';
import { userClient } from '../lib/server-client';
import { validateImage } from '../lib/media-validation';

const schema = z.object({ storeId: z.uuid(), folder: z.enum(['library', 'products', 'blocks', 'logos']),
  alt: z.string().trim().max(300), file: z.instanceof(File) });

export async function uploadMedia(form: FormData) {
  const input = schema.safeParse({ storeId: form.get('storeId'), folder: form.get('folder'),
    alt: form.get('alt'), file: form.get('file') });
  if (!input.success) return { error: 'format' as const };
  const { storeId, folder, alt, file } = input.data;
  const image = await validateImage(file);
  if ('error' in image) return { error: image.error };
  const client = await userClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return { error: 'auth' as const };
  const { data: member, error: permissionError } = await client.from('store_members').select('store_id')
    .eq('store_id', storeId).eq('user_id', user.id).maybeSingle();
  if (permissionError || !member) return { error: 'auth' as const };
  const path = `${storeId}/${folder}/${crypto.randomUUID()}.webp`;
  const { error: storageError } = await client.storage.from('store-media')
    .upload(path, image.bytes, { contentType: 'image/webp', upsert: false });
  if (storageError) return { error: 'upload' as const };
  const { data, error } = await client.from('media_assets').insert({ store_id: storeId, bucket: 'store-media',
    path, kind: 'image', mime_type: 'image/webp', size_bytes: image.bytes.length,
    width: image.width, height: image.height, alt_text: alt || null, created_by: user.id })
    .select('id,path,alt_text,size_bytes').single();
  if (error || !data) {
    await client.storage.from('store-media').remove([path]);
    return { error: 'upload' as const };
  }
  return { asset: data };
}
