'use server';

import { createStoreTemplate } from '@plataforma/blocks';
import { messages } from '@plataforma/i18n';
import { z } from 'zod';
import { isValidStoreSlug } from '@plataforma/core';
import { userClient } from '../../../lib/server-client';
import { validateImage } from '../../../lib/media-validation';
import { countryDefaults, storeSetupSchema } from '../../../lib/store-setup';
import { adminLocale } from '../../../lib/locale';

export async function checkStoreSlug(slug: string): Promise<'disponible' | 'en_uso' | 'invalida'> {
  if (!isValidStoreSlug(slug)) return 'invalida';
  const client = await userClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return 'invalida';
  const { data, error } = await client.rpc('check_store_slug', { p_slug: slug });
  if (error || !['disponible', 'en_uso', 'invalida'].includes(data)) return 'invalida';
  return data as 'disponible' | 'en_uso' | 'invalida';
}

export async function createStoreAction(
  form: FormData,
): Promise<{ storeId?: string; error?: 'invalid' | 'used' | 'limit' | 'failed' }> {
  const input = storeSetupSchema.safeParse(Object.fromEntries(form.entries()));
  if (!input.success) return { error: 'invalid' };
  const client = await userClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return { error: 'failed' };
  const slugState = await checkStoreSlug(input.data.slug);
  if (slugState !== 'disponible') return { error: slugState === 'en_uso' ? 'used' : 'invalid' };
  const { data: storeId, error } = await client.rpc('create_store', {
    p_name: input.data.name,
    p_slug: input.data.slug,
    p_country_code: input.data.country,
    p_currency: countryDefaults[input.data.country].currency,
    p_locale: input.data.locale,
    p_timezone: input.data.timezone,
  });
  if (error || !storeId) {
    if (error?.message.includes('DIRECCION_EN_USO')) return { error: 'used' };
    if (error?.message.includes('LIMITE_DE_TIENDAS') || error?.message.includes('SIN_PERMISO_PARA_CREAR')) return { error: 'limit' };
    return { error: 'failed' };
  }
  const locale = await adminLocale();
  const sample = messages[locale].blocks.templates[input.data.industry];
  const labels = messages[locale].admin.storeTemplate;
  const template = createStoreTemplate(
    input.data.industry,
    input.data.name,
    {
      ...sample,
      aboutTitle: labels.about,
      contactTitle: labels.contact,
      faqTitle: labels.faq,
      productsTitle: labels.products,
    },
    input.data.palette,
  );
  const { error: themeError } = await client
    .from('stores')
    .update({ theme_draft: template.theme })
    .eq('id', storeId);
  const { error: pageError } = await client
    .from('pages')
    .update({ draft_blocks: z.array(z.json()).parse(template.pages[0]?.blocks ?? []) })
    .eq('store_id', storeId)
    .eq('kind', 'home');
  if (themeError || pageError) return { storeId, error: 'failed' };
  const { error: templatesError } = await client.from('pages').insert(
    template.pages.slice(1).map((page, index) => ({
      store_id: storeId,
      kind: 'custom' as const,
      slug: page.slug,
      title: page.title,
      show_in_nav: true,
      nav_position: index + 1,
      draft_blocks: z.array(z.json()).parse(page.blocks),
    })),
  );
  if (templatesError) return { storeId, error: 'failed' };
  const logo = form.get('logo');
  if (logo instanceof File && logo.size > 0) {
    const checked = await validateImage(logo);
    if (!('error' in checked)) {
      const path = `${storeId}/logos/${crypto.randomUUID()}.webp`;
      const uploaded = await client.storage
        .from('store-media')
        .upload(path, checked.bytes, { contentType: 'image/webp', upsert: false });
      if (!uploaded.error) {
        const { data: asset } = await client
          .from('media_assets')
          .insert({
            store_id: storeId,
            bucket: 'store-media',
            path,
            kind: 'image',
            mime_type: 'image/webp',
            size_bytes: checked.bytes.length,
            width: checked.width,
            height: checked.height,
            created_by: user.id,
          })
          .select('id')
          .single();
        if (asset)
          await client.from('stores').update({ logo_asset_id: asset.id }).eq('id', storeId);
        else await client.storage.from('store-media').remove([path]);
      }
    }
  }
  return { storeId };
}
