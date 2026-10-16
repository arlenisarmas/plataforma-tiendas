import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@plataforma/db';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const next = request.nextUrl.searchParams.get('next');
  const destination = next === '/reset/new' || (next && /^\/invite\/[A-Za-z0-9_-]{32,100}$/.test(next))
    ? next : request.nextUrl.searchParams.get('first') === '1' ? '/welcome' : '/';
  if (!code) return NextResponse.redirect(new URL('/login?error=1', request.url));
  const response = NextResponse.redirect(new URL(destination, request.url));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.redirect(new URL('/login?error=1', request.url));
  const client = createServerClient(url, key, {
    getAll: () => request.cookies.getAll(),
    setAll: (updates, headers) => {
      for (const { name, value, options } of updates) response.cookies.set(name, value, options);
      for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
    },
  });
  const { error } = await client.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL('/login?error=1', request.url));
  const { data: { user } } = await client.auth.getUser();
  if (user) {
    const { data: profile } = await client.from('profiles').select('text_scale,locale').eq('id', user.id).single();
    if (profile) {
      response.cookies.set('text-scale', String(profile.text_scale), { path: '/', sameSite: 'lax' });
      response.cookies.set('admin-locale', profile.locale, { path: '/', sameSite: 'lax' });
    }
  }
  return response;
}
