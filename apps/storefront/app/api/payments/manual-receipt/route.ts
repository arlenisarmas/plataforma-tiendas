import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
// eslint-disable-next-line boundaries/dependencies -- server-only public export
import { createServiceClient } from '@plataforma/db/server';

const inputSchema = z.object({ paymentId: z.uuid(), orderToken: z.string().min(16),
  path: z.string().optional(), mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']).optional(),
  size: z.number().int().positive().max(5_242_880).optional() });

function fileType(bytes: Uint8Array): string | null {
  if (bytes.length >= 4 && String.fromCharCode(...bytes.slice(0, 4)) === '%PDF') return 'application/pdf';
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 8 && bytes.slice(0, 8).join(',') === '137,80,78,71,13,10,26,10') return 'image/png';
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
      String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') return 'image/webp';
  return null;
}

async function authorized(raw: unknown) {
  const input = inputSchema.safeParse(raw);
  if (!input.success) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const client = createServiceClient(url, key);
  const { data: payment } = await client.from('payments')
    .select('id,store_id,order_id,status,provider,receipt_asset_id').eq('id', input.data.paymentId).maybeSingle();
  if (!payment || payment.provider !== 'manual' || !['pending', 'in_review'].includes(payment.status)) return null;
  const order = await client.rpc('get_order_for_buyer', { p_order_id: payment.order_id, p_token: input.data.orderToken });
  if (order.error) return null;
  return { client, payment, input: input.data };
}

export async function POST(request: Request) {
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: 'invalid' }, { status: 400 }); }
  const context = await authorized(raw);
  if (!context || !context.input.mimeType || !context.input.size || context.payment.receipt_asset_id)
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
    'application/pdf': 'pdf' }[context.input.mimeType];
  const path = `${context.payment.store_id}/${context.payment.id}/${randomUUID()}.${extension}`;
  const { data, error } = await context.client.storage.from('payment-receipts').createSignedUploadUrl(path);
  if (error || !data) return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  return NextResponse.json({ path, signedUrl: data.signedUrl, token: data.token });
}

export async function PATCH(request: Request) {
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: 'invalid' }, { status: 400 }); }
  const context = await authorized(raw);
  if (!context || !context.input.path || context.payment.receipt_asset_id ||
      !new RegExp(`^${context.payment.store_id}/${context.payment.id}/[a-f0-9-]{36}\\.(jpg|png|webp|pdf)$`)
        .test(context.input.path)) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const { data: file, error } = await context.client.storage.from('payment-receipts').download(context.input.path);
  if (error || !file) return NextResponse.json({ error: 'missing' }, { status: 404 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = fileType(bytes);
  if (!mime || bytes.length > 5_242_880 || bytes.length === 0) {
    await context.client.storage.from('payment-receipts').remove([context.input.path]);
    return NextResponse.json({ error: 'invalid file' }, { status: 400 });
  }
  const asset = await context.client.from('media_assets').insert({ store_id: context.payment.store_id,
    bucket: 'payment-receipts', path: context.input.path, kind: mime === 'application/pdf' ? 'document' : 'image',
    mime_type: mime, size_bytes: bytes.length }).select('id').single();
  if (asset.error || !asset.data) return NextResponse.json({ error: 'retry' }, { status: 500 });
  const saved = await context.client.from('payments').update({ receipt_asset_id: asset.data.id })
    .eq('id', context.payment.id).is('receipt_asset_id', null).select('id').maybeSingle();
  if (saved.error || !saved.data) return NextResponse.json({ error: 'retry' }, { status: 500 });
  const applied = await context.client.rpc('apply_payment_status', { p_payment_id: context.payment.id, p_status: 'in_review' });
  if (applied.error) return NextResponse.json({ error: 'retry' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
