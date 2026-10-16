import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
// The server-only public export is intentionally separate from the browser-safe db entry point.
// eslint-disable-next-line boundaries/dependencies
import { createServiceClient } from '@plataforma/db/server';
import { createMercadoPagoAuthorizationUrl, exchangeMercadoPagoCode } from '@plataforma/payments';
import { userClient } from '../../../../lib/server-client';

const stateSchema = z.object({ store: z.uuid(), nonce: z.uuid() });

export async function GET(request: Request) {
  const url = new URL(request.url);
  const clientId = process.env.MERCADOPAGO_CLIENT_ID;
  const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET;
  const redirectUri = process.env.MERCADOPAGO_REDIRECT_URI;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!clientId || !clientSecret || !redirectUri || !supabaseUrl || !serviceKey)
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  const user = await userClient();
  const { data: { user: account } } = await user.auth.getUser();
  if (!account) return NextResponse.redirect(new URL('/login', url));

  const code = z.string().min(1).safeParse(url.searchParams.get('code'));
  const state = z.string().min(1).safeParse(url.searchParams.get('state'));
  if (!code.success) {
    const store = z.uuid().safeParse(url.searchParams.get('store'));
    if (!store.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
    const { data: member } = await user.from('store_members').select('role').eq('store_id', store.data)
      .eq('user_id', account.id).maybeSingle();
    if (member?.role !== 'owner') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    const nonce = randomUUID();
    const encoded = Buffer.from(JSON.stringify({ store: store.data, nonce })).toString('base64url');
    const response = NextResponse.redirect(createMercadoPagoAuthorizationUrl(clientId, redirectUri, encoded));
    response.cookies.set('mp-oauth-state', encoded, { httpOnly: true, secure: url.protocol === 'https:',
      sameSite: 'lax', maxAge: 600, path: '/api/payments/mercadopago' });
    return response;
  }
  const cookie = request.headers.get('cookie')?.match(/(?:^|;\s*)mp-oauth-state=([^;]+)/)?.[1];
  if (!state.success || !cookie || cookie !== state.data)
    return NextResponse.json({ error: 'invalid state' }, { status: 400 });
  let parsed: unknown;
  try { parsed = JSON.parse(Buffer.from(state.data, 'base64url').toString()); }
  catch { return NextResponse.json({ error: 'invalid state' }, { status: 400 }); }
  const stateData = stateSchema.safeParse(parsed);
  if (!stateData.success) return NextResponse.json({ error: 'invalid state' }, { status: 400 });
  const storeId = stateData.data.store;
  const { data: member } = await user.from('store_members').select('role').eq('store_id', storeId)
    .eq('user_id', account.id).maybeSingle();
  if (member?.role !== 'owner') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  try {
    const token = await exchangeMercadoPagoCode(code.data, clientId, clientSecret, redirectUri);
    const service = createServiceClient(supabaseUrl, serviceKey);
    const { data: method, error: saveError } = await service.from('store_payment_methods').upsert({
      store_id: storeId, provider: 'mercadopago', method_key: 'default', display_name: 'Mercado Pago',
      connected_account_id: String(token.user_id), connected_at: null, is_enabled: false,
    }, { onConflict: 'store_id,provider,method_key' }).select('id').single();
    if (saveError || !method) throw new Error('Unable to save payment method');
    const saved = await service.rpc('set_payment_secret', { p_method_id: method.id, p_secret: token.access_token });
    if (saved.error) throw new Error('Unable to save payment secret');
    const enabled = await service.from('store_payment_methods').update({
      connected_at: new Date().toISOString(), is_enabled: true,
    }).eq('id', method.id);
    if (enabled.error) throw new Error('Unable to enable payment method');
  } catch {
    return NextResponse.redirect(new URL(`/settings?store=${storeId}&payment=error`, url));
  }
  const response = NextResponse.redirect(new URL(`/settings?store=${storeId}&payment=connected`, url));
  response.cookies.delete('mp-oauth-state');
  return response;
}
