import { NextResponse, type NextRequest } from 'next/server';
import { findStoreByHost } from './lib/storefront-data';

const STORE_COOKIE = 'tienda';
const slugPattern = /^[a-z0-9](-?[a-z0-9]){2,39}$/;

/** Dirección compartida de la plataforma (p. ej. tiendas-storefront.vercel.app) donde se elige la tienda con ?tienda=. */
function isPlatformHost(host: string): boolean {
  const configured = process.env.NEXT_PUBLIC_STOREFRONT_URL;
  if (!configured) return false;
  try { return new URL(configured).hostname.toLowerCase() === host; } catch { return false; }
}

export async function middleware(request: NextRequest) {
  const host = (request.headers.get('host') ?? '').toLowerCase().replace(/:\d+$/, '');
  const local = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.localhost');
  const shared = local || isPlatformHost(host);
  const requested = request.nextUrl.searchParams.get('tienda') ?? undefined;
  const remembered = request.cookies.get(STORE_COOKIE)?.value;
  // En la dirección compartida, ?tienda= elige la tienda y se recuerda para los enlaces internos.
  const chosen = shared && host !== 'localhost' && host.endsWith('.localhost') ? host.slice(0, -'.localhost'.length)
    : shared ? (requested ?? remembered) : undefined;
  const slug = chosen && slugPattern.test(chosen) ? chosen : undefined;
  let storeId: string | undefined;
  try { storeId = await findStoreByHost(host, slug); } catch { storeId = undefined; }
  if (!storeId && slug && !requested) {
    try { storeId = await findStoreByHost(host); } catch { storeId = undefined; }
  }
  const url = request.nextUrl.clone();
  url.pathname = `/_sites/${storeId ?? 'unknown'}${url.pathname === '/' ? '' : url.pathname}`;
  const response = NextResponse.rewrite(url);
  if (shared && requested && slug && storeId && !host.endsWith('.localhost')) {
    response.cookies.set(STORE_COOKIE, slug, { path: '/', sameSite: 'lax', httpOnly: true, maxAge: 60 * 60 * 24 * 7 });
  }
  return response;
}

export const config = { matcher: ['/((?!_next|api|preview|_sites|favicon.ico|robots.txt|sitemap.xml).*)'] };
