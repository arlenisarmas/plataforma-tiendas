import { createBrowserClient as createSsrBrowserClient, createServerClient as createSsrServerClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export type StorefrontClient = SupabaseClient<Database, 'storefront'>;
export type UserClient = SupabaseClient<Database>;

export function createBrowserClient(url: string, publishableKey: string): UserClient {
  return createSsrBrowserClient<Database>(url, publishableKey);
}

type CookieStore = NonNullable<Parameters<typeof createSsrServerClient<Database>>[2]>['cookies'];

export function createServerClient(url: string, publishableKey: string, cookies: CookieStore): UserClient {
  return createSsrServerClient<Database>(url, publishableKey, { cookies });
}

/** Public views only; never exposes the public schema through this client. */
export function createStorefrontClient(url: string, publishableKey: string): StorefrontClient {
  return createClient<Database, 'storefront'>(url, publishableKey, {
    db: { schema: 'storefront' },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
