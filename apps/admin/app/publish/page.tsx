import { panelContext } from '../../lib/panel-data';
import { adminText } from '../../lib/locale';
import { canPublish } from '../../lib/publish-checks';
import { publishChecks } from '../../lib/publish-data';
import { PanelShell } from '../panel-shell';
import { publishStore } from './actions';
import { legalSlugs } from '../../lib/legal-drafts';

export default async function PublishPage({ searchParams }: { searchParams: Promise<{ store?: string; result?: string }> }) {
  const [params, t] = await Promise.all([searchParams, adminText()]);
  const context = await panelContext(params.store);
  const checks = await publishChecks(context.selected.id, context.client);
  const { data: legalPages, error: legalError } = await context.client.from('pages')
    .select('slug,published_version_id').eq('store_id', context.selected.id).eq('kind', 'legal');
  if (legalError) throw legalError;
  const labels = ['home', 'product', 'payment', 'shipping'] as const;
  const base = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN;
  const address = base ? `https://${context.selected.slug}.${base}` : null;
  const published = context.selected.status === 'published';
  return <PanelShell context={context} active="settings"><main className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
    <h1 className="text-3xl font-bold">{t('publishStore.title')}</h1>
    <p>{t('publishStore.intro')}</p>
    <ul className="space-y-2">{labels.map((key) => <li key={key} className="flex min-h-11 items-center gap-3 rounded border p-3">
      <span aria-hidden="true">{checks[key] ? '✓' : '○'}</span><span>{t(`publishStore.${key}`)}</span>
      <span className="sr-only">{checks[key] ? t('completed') : t('pending')}</span>
    </li>)}</ul>
    <section className="space-y-3"><h2 className="text-xl font-semibold">{t('publishLegal.title')}</h2>
      <p>{t('publishLegal.help')}</p>
      <ul className="space-y-2">{legalSlugs.map((slug) => <li key={slug} className="flex min-h-11 items-center justify-between gap-3 rounded border p-3">
        <span>{t(`legalDrafts.${slug}.title`)}</span>
        <span>{legalPages?.some((page) => page.slug === slug && page.published_version_id)
          ? t('completed') : t('publishLegal.pending')}</span>
      </li>)}</ul>
      <a className="inline-flex min-h-11 items-center underline" href={`/settings?store=${context.selected.id}`}>{t('publishLegal.edit')}</a>
    </section>
    {params.result && <p role="status" className="rounded border p-3">{t(`publishStore.result.${
      ['published', 'missing', 'config', 'domain', 'save', 'permission', 'invalid'].includes(params.result) ? params.result : 'save'}`)}</p>}
    {published && address && <p><a className="underline" href={address} target="_blank" rel="noreferrer">{address}</a></p>}
    <form action={publishStore}><input type="hidden" name="storeId" value={context.selected.id} />
      <button className="min-h-11 rounded bg-[#5b5fe0] px-6 text-white disabled:opacity-50"
        disabled={!canPublish(checks)}>{published ? t('publishStore.update') : t('publishStore.open')}</button></form>
    {!canPublish(checks) && <p>{t('publishStore.missingHelp')}</p>}
  </main></PanelShell>;
}
