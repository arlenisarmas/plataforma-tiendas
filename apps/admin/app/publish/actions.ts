'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { panelContext } from '../../lib/panel-data';
import { canPublish } from '../../lib/publish-checks';
import { publishChecks } from '../../lib/publish-data';
import { createDomain, findDomain } from '../../lib/domain-admin';

export async function publishStore(form: FormData) {
  const storeId = z.uuid().safeParse(form.get('storeId'));
  if (!storeId.success) redirect('/publish?result=invalid');
  const href = `/publish?store=${storeId.data}`;
  const context = await panelContext(storeId.data);
  if (context.selected.id !== storeId.data) redirect(`${href}&result=permission`);
  const { data: owner, error: ownerError } = await context.client.from('store_members').select('role')
    .eq('store_id', storeId.data).eq('user_id', context.userId).maybeSingle();
  if (ownerError || owner?.role !== 'owner') redirect(`${href}&result=permission`);
  if (!canPublish(await publishChecks(storeId.data, context.client))) redirect(`${href}&result=missing`);
  const domain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN;
  if (!domain || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) redirect(`${href}&result=config`);
  const hostname = `${context.selected.slug}.${domain}`;
  if (!z.string().regex(/^[a-z0-9.-]+$/).safeParse(hostname).success) redirect(`${href}&result=config`);
  let existing: string | undefined;
  try { existing = await findDomain(hostname); } catch { redirect(`${href}&result=domain`); }
  if (existing && existing !== storeId.data) redirect(`${href}&result=domain`);
  if (!existing) {
    try { await createDomain(storeId.data, hostname); } catch { redirect(`${href}&result=domain`); }
  }
  const { error } = await context.client.rpc('publish_store', { p_store_id: storeId.data });
  if (error) redirect(`${href}&result=save`);
  const base = process.env.NEXT_PUBLIC_STOREFRONT_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (base && secret) await fetch(`${base.replace(/\/$/, '')}/api/revalidate`, { method: 'POST',
    headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ storeId: storeId.data }) }).catch(() => undefined);
  redirect(`${href}&result=published`);
}
