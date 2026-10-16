import { NextResponse, type NextRequest } from 'next/server';
import { findStoreByHost } from './lib/storefront-data';

export async function middleware(request: NextRequest) {
  const host = (request.headers.get('host') ?? '').toLowerCase().replace(/:\d+$/, '');
  const local = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.localhost');
  const slug = local && host === 'localhost' ? request.nextUrl.searchParams.get('tienda') ?? undefined
    : local && host.endsWith('.localhost') ? host.slice(0, -'.localhost'.length) : undefined;
  let storeId: string | undefined;
  try { storeId = await findStoreByHost(host, slug); } catch { storeId = undefined; }
  const url = request.nextUrl.clone();
  url.pathname = `/_sites/${storeId ?? 'unknown'}${url.pathname === '/' ? '' : url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = { matcher: ['/((?!_next|api|_sites|favicon.ico|robots.txt|sitemap.xml).*)'] };
