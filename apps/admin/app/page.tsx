import { adminText } from '../lib/locale';
import { dashboardData } from '../lib/panel-data';
import { readNotification } from './notification-actions';
import { PanelShell } from './panel-shell';
import { QuickSearch } from './quick-search';

export default async function HomePage({ searchParams }: { searchParams: Promise<{ store?: string }> }) {
  const [{ store }, t] = await Promise.all([searchParams, adminText()]);
  const data = await dashboardData(store);
  const selected = data.selected.id;
  const items = [
    { key: 'logo', href: `/page?store=${selected}` }, { key: 'product', href: `/products?store=${selected}` },
    { key: 'payment', href: `/settings?store=${selected}` }, { key: 'shipping', href: `/settings?store=${selected}` },
    { key: 'page', href: `/page?store=${selected}` }, { key: 'publish', href: `/publish?store=${selected}` },
  ] as const;
  return <PanelShell context={data} active="home">
    <main className="space-y-6 p-4 md:p-8">
      <h1 className="text-3xl font-bold">{t('nav.home')}</h1>
      <QuickSearch label={t('quickSearch')} actions={[
        { label: t('quickAddProduct'), href: `/products?store=${selected}` },
        { label: t('quickColors'), href: `/page?store=${selected}` },
        { label: t('quickOrders'), href: `/orders?store=${selected}` },
      ]} />
      <section aria-labelledby="progress-heading" className="rounded-xl border border-[#2a2f3c] p-4">
        <h2 id="progress-heading" className="text-xl font-bold">{t('checklistTitle')}</h2>
        <p>{t('checklistCount', { count: Object.values(data.checks).filter(Boolean).length })}</p>
        <ul className="mt-3 space-y-2">{items.map(({ key, href }) => <li key={key}>
          <a className="flex min-h-11 items-center gap-3 rounded-lg border border-[#2a2f3c] px-3" href={href}>
            <span aria-hidden="true">{data.checks[key] ? '✓' : '○'}</span><span>{t(`checklist.${key}`)}</span>
            <span className="sr-only">{data.checks[key] ? t('completed') : t('pending')}</span>
          </a>
        </li>)}</ul>
      </section>
      <section aria-labelledby="today-heading" className="rounded-xl border border-[#2a2f3c] p-4">
        <h2 id="today-heading" className="text-xl font-bold">{t('today')}</h2>
        <p>{t('ordersToday', { count: data.ordersToday })}</p>
      </section>
      <section aria-labelledby="alerts-heading" className="rounded-xl border border-[#2a2f3c] p-4">
        <h2 id="alerts-heading" className="text-xl font-bold">{t('notifications')}</h2>
        {data.notifications.length === 0 ? <p>{t('noNotifications')}</p> : <ul className="mt-3 space-y-3">
          {data.notifications.map((note) => <li key={note.id} className="rounded-lg border border-[#2a2f3c] p-3">
            <p className="font-semibold">{note.title}</p>{note.body && <p>{note.body}</p>}
            {note.link?.startsWith('/') && !note.link.startsWith('//') && <a className="inline-flex min-h-11 items-center" href={note.link}>{t('viewNotification')}</a>}
            {!note.read_at && <form action={readNotification}><input type="hidden" name="id" value={note.id} />
              <button className="auth-secondary mt-2" type="submit">{t('markRead')}</button></form>}
          </li>)}
        </ul>}
      </section>
    </main>
  </PanelShell>;
}
