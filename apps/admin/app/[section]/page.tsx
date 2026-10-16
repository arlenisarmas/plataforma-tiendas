import { notFound } from 'next/navigation';
import { adminText } from '../../lib/locale';
import { panelContext } from '../../lib/panel-data';
import { PanelShell } from '../panel-shell';

const sectionNames = ['products', 'orders', 'page', 'customers', 'settings'] as const;
export default async function SectionPage({ params, searchParams }: {
  params: Promise<{ section: string }>; searchParams: Promise<{ store?: string }>;
}) {
  const [{ section }, { store }, t] = await Promise.all([params, searchParams, adminText()]);
  if (!sectionNames.some((name) => name === section)) notFound();
  const context = await panelContext(store);
  return <PanelShell context={context} active={section}>
    <main className="space-y-4 p-4 md:p-8">
      <h1 className="text-3xl font-bold">{t(`nav.${section}` as 'nav.products')}</h1>
      <p>{t('sectionSoon')}</p>
      {section === 'page' && <div className="flex flex-wrap gap-3">
        <a className="auth-primary" href={`/page/edit?store=${context.selected.id}`}>{t('editor.title')}</a>
        <a className="auth-secondary" href={`/page/media?store=${context.selected.id}`}>{t('media.title')}</a>
      </div>}
    </main>
  </PanelShell>;
}
