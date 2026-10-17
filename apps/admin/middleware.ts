import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@plataforma/db';

const publicPaths = ['/login', '/signup', '/forgot', '/reset/new', '/auth/callback'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (publicPaths.some((publicPath) => path === publicPath) || path.startsWith('/_next/')
    || path.startsWith('/join/') || path.startsWith('/invite/')) return NextResponse.next();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.redirect(new URL('/login', request.url));
  let response = NextResponse.next({ request });
  const client = createServerClient(url, key, {
    getAll: () => request.cookies.getAll(),
    setAll: (updates, headers) => {
      for (const { name, value } of updates) request.cookies.set(name, value);
      response = NextResponse.next({ request });
      for (const { name, value, options } of updates) response.cookies.set(name, value, options);
      for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
    },
  });
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', request.url));
  return response;
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
