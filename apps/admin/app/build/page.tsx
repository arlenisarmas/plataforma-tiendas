import Link from 'next/link';
import { headers } from 'next/headers';
import { z } from 'zod';
import { fromMinor, type CurrencyCode } from '@plataforma/core';
import { adminText } from '../../lib/locale';
import { buildSteps, stepDone, type BuildStep } from '../../lib/build-blocks';
import { dashboardData } from '../../lib/panel-data';
import { createPreviewToken } from '../../lib/preview-token';
import { socialLink } from '../../lib/store-details-data';
import { currentViewer } from '../../lib/viewer';
import { MediaPicker } from '../media-picker';
import { ProductForm } from '../products/new/product-form';
import { publishStore } from '../publish/actions';
import { SettingsForms } from '../settings/settings-forms';
import { StoreDetails } from '../settings/store-details';
import { CoverStep } from './cover-step';

const heroBlock = z.object({ type: z.literal('hero'), variant: z.string().optional(),
  props: z.object({ title: z.string().optional(), subtitle: z.string().optional(),
    image: z.object({ assetId: z.uuid() }).optional() }).loose() }).loose();

function previewExpiry() { return Date.now() + 15 * 60_000; }

/** Recorrido guiado para armar la tienda paso a paso (T-038). */
export default async function BuildPage({ searchParams }: { searchParams: Promise<{ store?: string; step?: string; saved?: string; result?: string }> }) {
  const [params, t, viewer] = await Promise.all([searchParams, adminText(), currentViewer()]);
  const data = await dashboardData(params.store);
  const { client, selected } = data;
  const storeId = selected.id;
  const [storeRow, homePage, productCount] = await Promise.all([
    client.from('stores').select('slug,currency,default_locale,contact').eq('id', storeId).single(),
    client.from('pages').select('id,draft_blocks').eq('store_id', storeId).eq('kind', 'home').single(),
    client.from('products').select('id', { count: 'exact', head: true }).eq('store_id', storeId).eq('status', 'active'),
  ]);
  if (storeRow.error || !storeRow.data) throw storeRow.error ?? new Error('Store unavailable');
  const contact = z.record(z.string(), z.unknown()).catch({}).parse(storeRow.data.contact);
  const hasContact = ['whatsapp', 'email', 'phone'].some((key) => typeof contact[key] === 'string' && (contact[key] as string).trim() !== '');
  const done = Object.fromEntries(buildSteps.map((step) => [step, stepDone(step, data.checks, hasContact)])) as Record<BuildStep, boolean>;
  const requested = buildSteps.find((step) => step === params.step);
  const step: BuildStep = requested ?? buildSteps.find((item) => !done[item]) ?? 'open';
  const index = buildSteps.indexOf(step);
  const nextStep = buildSteps[index + 1];
  const prevStep = buildSteps[index - 1];
  const href = (target: BuildStep) => `/build?store=${storeId}&step=${target}`;
  const exitHref = viewer.isAdmin ? '/platform' : '/';

  // Vista previa en vivo de la página de inicio (borrador) en la tienda.
  const { data: { session } } = await client.auth.getSession();
  const requestHeaders = await headers();
  const host = requestHeaders.get('host') ?? 'localhost:3001';
  const scheme = requestHeaders.get('x-forwarded-proto') ?? (host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https');
  const previewBase = (process.env.NEXT_PUBLIC_STOREFRONT_URL || 'http://localhost:3000').replace(/\/$/, '');
  const previewToken = homePage.data && session?.access_token && process.env.PREVIEW_SECRET ? createPreviewToken({ storeId,
    pageId: homePage.data.id, accessToken: session.access_token, origin: `${scheme}://${host}`, expiresAt: previewExpiry() },
  process.env.PREVIEW_SECRET) : null;

  const mediaKeys = ['choose', 'upload', 'camera', 'alt', 'suggestion', 'invalid', 'failed', 'selected', 'empty'] as const;
  const mediaLabels = Object.fromEntries(mediaKeys.map((key) => [key, t(`media.${key}`)])) as Record<(typeof mediaKeys)[number], string>;
  const assets = step === 'cover' || step === 'products'
    ? (await client.from('media_assets').select('id,path,alt_text,size_bytes').eq('store_id', storeId).eq('kind', 'image')
      .order('created_at', { ascending: false }).limit(60)).data ?? [] : [];

  let content: React.ReactNode = null;
  if (step === 'cover') {
    const blocks = z.array(z.unknown()).catch([]).parse(homePage.data?.draft_blocks);
    const hero = blocks.map((block) => heroBlock.safeParse(block)).find((result) => result.success)?.data;
    const variant = hero?.variant === 'background' || hero?.variant === 'minimal' ? hero.variant : 'split';
    content = <CoverStep storeId={storeId} assets={assets} mediaLabels={mediaLabels} onSavedHref={href(nextStep ?? 'open')}
      initial={{ title: hero?.props.title ?? selected.name, subtitle: hero?.props.subtitle ?? '', variant, assetId: hero?.props.image?.assetId ?? null }}
      labels={{ title: t('build.cover.title'), subtitle: t('build.cover.subtitle'), design: t('build.cover.design'), photo: t('build.cover.photo'),
        save: t('build.cover.save'), saved: t('build.cover.saved'), error: t('build.cover.error'),
        variants: { split: t('build.cover.variants.split'), background: t('build.cover.variants.background'), minimal: t('build.cover.variants.minimal') } }} />;
  } else if (step === 'products') {
    const categories = (await client.from('categories').select('id,name').eq('store_id', storeId).order('position')).data ?? [];
    const keys = ['name', 'description', 'price', 'stock', 'category', 'draft', 'active', 'saveDraft', 'publish',
      'advanced', 'slug', 'variantName', 'optionName', 'optionValues', 'compare', 'cost', 'sku', 'weight', 'addOption', 'saveError'] as const;
    const labels = Object.fromEntries(keys.map((key) => [key, t(`products.${key}`)])) as Record<(typeof keys)[number], string>;
    content = <div className="flex flex-col gap-5">
      <p role="status" className={`m-0 rounded-xl p-3 ${params.saved ? 'bg-[#173b2e] text-[#7ee2b3]' : 'bg-[#171a23] text-[#c9cdd8]'}`}>
        {params.saved ? `${t('products.saved')} ` : ''}{t('build.steps.products.count', { count: productCount.count ?? 0 })}</p>
      <ProductForm storeId={storeId} categories={categories} labels={labels} afterSaveHref={`${href('products')}&saved=1`}
        media={<MediaPicker storeId={storeId} folder="products" initial={assets} labels={mediaLabels} />} />
    </div>;
  } else if (step === 'payments') {
    const [shipping, payments, mercadoPago] = await Promise.all([
      client.from('shipping_methods').select('id,name,kind,description,price_amount,free_over_amount').eq('store_id', storeId).order('position'),
      client.from('store_payment_methods').select('method_key').eq('store_id', storeId).eq('provider', 'manual').eq('is_enabled', true),
      client.from('store_payment_methods').select('id').eq('store_id', storeId).eq('provider', 'mercadopago').eq('is_enabled', true).maybeSingle(),
    ]);
    const currency = storeRow.data.currency as CurrencyCode;
    const format = (amount: number | null) => amount === null ? '' : fromMinor(BigInt(amount), currency, storeRow.data.default_locale);
    const keys = ['title', 'shipping', 'payment', 'pickup', 'flatRate', 'name', 'description', 'price', 'freeOver', 'save', 'saved', 'error',
      'method', 'transfer', 'mobile', 'zelle', 'cash', 'holder', 'bank', 'account', 'phone', 'email', 'note', 'mercadoPago', 'comingSoon', 'configured'] as const;
    const labels = Object.fromEntries(keys.map((key) => [key, t(`commerce.${key}`)])) as Record<(typeof keys)[number], string>;
    const methodSchema = z.enum(['transferencia', 'pago-movil', 'zelle', 'efectivo']);
    content = <SettingsForms storeId={storeId} labels={labels} mercadoPagoConnected={Boolean(mercadoPago.data)}
      shipping={(shipping.data ?? []).filter((item) => item.kind === 'pickup' || item.kind === 'flat_rate').map((item) => ({ ...item,
        kind: item.kind as 'pickup' | 'flat_rate', price: format(item.price_amount), freeOver: format(item.free_over_amount) }))}
      methods={(payments.data ?? []).map((item) => methodSchema.safeParse(item.method_key)).filter((result) => result.success).map((result) => result.data)} />;
  } else if (step === 'contact') {
    const detailKeys = ['email', 'phone', 'whatsapp', 'address', 'instagram', 'facebook'] as const;
    const details = z.record(z.string(), z.string()).safeParse(storeRow.data.contact);
    const labels = Object.fromEntries(['title', 'save', 'saved', 'error', ...detailKeys].map((key) => [key, t(`storeDetails.${key}`)])) as
      Record<'title' | 'save' | 'saved' | 'error' | (typeof detailKeys)[number], string>;
    const initial = Object.fromEntries(detailKeys.map((key) => [key, key === 'instagram' || key === 'facebook'
      ? socialLink(storeRow.data.contact, key === 'instagram' ? 'Instagram' : 'Facebook') : details.success ? details.data[key] ?? '' : ''])) as Record<(typeof detailKeys)[number], string>;
    content = <StoreDetails storeId={storeId} labels={labels} initial={initial} />;
  } else {
    const published = params.result === 'published' || selected.status === 'published';
    const storeUrl = `${previewBase}/?tienda=${storeRow.data.slug}`;
    const pending = buildSteps.filter((item) => item !== 'open' && !done[item]);
    content = published
      ? <div role="status" className="flex flex-col items-start gap-4 rounded-2xl border border-[#2f7d5b] bg-[#173b2e] p-6">
          <strong className="text-2xl text-[#7ee2b3]">🎉 {t('build.steps.open.celebrate')}</strong>
          <p className="m-0 text-[#c9cdd8]">{t('build.steps.open.celebrateHelp')}</p>
          <input readOnly value={storeUrl} aria-label={t('build.steps.open.visit')} className="auth-input mt-0" />
          <div className="flex flex-wrap gap-3">
            <a className="auth-primary" href={storeUrl} target="_blank" rel="noreferrer">{t('build.steps.open.visit')}</a>
            <a className="auth-secondary" target="_blank" rel="noreferrer"
              href={`https://wa.me/?text=${encodeURIComponent(`${t('build.steps.open.shareText')} ${storeUrl}`)}`}>{t('build.steps.open.share')}</a>
          </div>
        </div>
      : <div className="flex flex-col gap-4">
          {params.result && params.result !== 'published' && <p role="alert" className="m-0 rounded-xl bg-[#3b1a20] p-3 text-[#ff9aa5]">
            {t.has(`publishStore.result.${params.result}`) ? t(`publishStore.result.${params.result}`) : t('publishStore.result.save')}</p>}
          {pending.length === 0 ? <p className="m-0 text-[#7ee2b3]">{t('build.steps.open.ready')}</p>
            : <div className="flex flex-col gap-2"><span className="font-semibold text-[#a3a9b8]">{t('build.steps.open.pending')}</span>
                <ul className="m-0 flex list-none flex-col gap-1 p-0">{pending.map((item) => <li key={item}>
                  <Link href={href(item)} className="flex min-h-11 items-center gap-3 text-[#e9ebf2]">
                    <span aria-hidden="true" className="h-[18px] w-[18px] rounded-full border-2 border-[#3a3f55]" />{t(`build.steps.${item}.title`)}</Link></li>)}</ul></div>}
          <form action={publishStore}>
            <input type="hidden" name="storeId" value={storeId} /><input type="hidden" name="from" value="build" />
            <button type="submit" className="auth-primary w-full">{t('build.steps.open.open')}</button>
          </form>
        </div>;
  }

  return <div className="min-h-screen bg-[#0e1016]">
    <div className="mx-auto flex max-w-[1180px] flex-col gap-7 px-4 py-7 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={exitHref} className="text-[15px] no-underline">← {viewer.isAdmin ? t('shell.console') : t('build.exit')}</Link>
        <span className="text-sm text-[#a3a9b8]">{selected.name} · {t('build.progress', { step: index + 1, total: buildSteps.length })}</span>
      </div>
      <nav aria-label={t('build.progress', { step: index + 1, total: buildSteps.length })}>
        <ol className="m-0 grid list-none grid-cols-5 gap-2 p-0">{buildSteps.map((item, at) => <li key={item}>
          <Link href={href(item)} aria-current={item === step ? 'step' : undefined} className="flex flex-col gap-2 text-[13px] text-[#a3a9b8] no-underline aria-[current=step]:font-bold aria-[current=step]:text-[#e9ebf2]">
            <span aria-hidden="true" className={`h-1.5 rounded ${done[item] ? 'bg-[#3fb37f]' : at <= index ? 'bg-[#7c80f2]' : 'bg-[#262a36]'}`} />
            <span className="hidden sm:inline">{done[item] ? '✓ ' : ''}{t(`build.steps.${item}.title`)}</span>
            <span className="sr-only sm:hidden">{t(`build.steps.${item}.title`)}{done[item] ? ` · ${t('build.done')}` : ''}</span>
          </Link></li>)}</ol>
      </nav>
      <div className="flex flex-wrap items-start gap-8">
        <main className="flex min-w-0 flex-[1_1_440px] flex-col gap-5">
          <h1 className="m-0 text-[clamp(1.75rem,4vw,2.125rem)] leading-tight">{t(`build.steps.${step}.title`)}</h1>
          <p className="m-0 text-base leading-relaxed text-[#c9cdd8]">{t(`build.steps.${step}.intro`)}</p>
          <details className="rounded-xl border border-[#232733] bg-[#171a23] px-4 py-3">
            <summary className="min-h-11 cursor-pointer content-center font-semibold text-[#afb4ff]">{t('build.why')}</summary>
            <p className="m-0 mt-2 leading-relaxed text-[#c9cdd8]">{t(`build.steps.${step}.why`)}</p>
          </details>
          <div className="panel-card p-5">{content}</div>
          <div className="flex flex-wrap items-center gap-3">
            {prevStep && <Link href={href(prevStep)} className="auth-secondary">{t('build.back')}</Link>}
            {nextStep && <Link href={href(nextStep)} className="auth-primary flex-1">{done[step] ? t('build.next') : t('build.skip')} →</Link>}
            <Link href={`/?store=${storeId}`} className="min-h-11 content-center text-sm">{t('build.advanced')}</Link>
          </div>
        </main>
        <aside aria-label={t('build.preview')} className="flex min-w-0 flex-[1_1_380px] flex-col gap-3 lg:sticky lg:top-6">
          <span className="text-sm font-semibold text-[#a3a9b8]">{t('build.preview')}</span>
          {previewToken
            ? <iframe title={t('build.preview')} src={`${previewBase}/preview/${previewToken}`} className="h-[640px] w-full rounded-2xl border border-[#232733] bg-white" />
            : <div className="flex h-[320px] items-center justify-center rounded-2xl border border-dashed border-[#3a3f55] p-6 text-center text-[#a3a9b8]">{t('editor.previewUnavailable')}</div>}
          <span className="text-[13px] text-[#a3a9b8]">{t('build.previewHelp')}</span>
        </aside>
      </div>
    </div>
  </div>;
}
