import 'server-only';
import { z } from 'zod';

const domainSchema = z.array(z.object({ store_id: z.uuid() }));

function config() {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) throw new Error('Missing server Supabase settings');
  return { base, headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' } };
}

export async function findDomain(hostname: string): Promise<string | undefined> {
  const { base, headers } = config();
  const url = new URL('rest/v1/store_domains', `${base.replace(/\/$/, '')}/`);
  url.searchParams.set('select', 'store_id');
  url.searchParams.set('hostname', `eq.${hostname}`);
  const response = await fetch(url, { headers, cache: 'no-store' });
  if (!response.ok) throw new Error('Domain lookup failed');
  return domainSchema.parse(await response.json())[0]?.store_id;
}

export async function createDomain(storeId: string, hostname: string): Promise<void> {
  const { base, headers } = config();
  const response = await fetch(new URL('rest/v1/store_domains', `${base.replace(/\/$/, '')}/`), {
    method: 'POST', headers, body: JSON.stringify({ store_id: storeId, hostname, kind: 'subdomain',
      is_primary: true, verified_at: new Date().toISOString() }), cache: 'no-store',
  });
  if (!response.ok) throw new Error('Domain registration failed');
}
