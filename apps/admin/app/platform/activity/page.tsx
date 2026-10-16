import { z } from 'zod';
import { adminText } from '../../../lib/locale';
import { platformActivity, platformPeople, platformStores } from '../../../lib/platform-data';
import { ActivityList, Panel } from '../parts';
import { PlatformShell } from '../platform-shell';

const PAGE = 50;

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ store?: string; person?: string; page?: string }> }) {
  const [t, params] = await Promise.all([adminText(), searchParams]);
  const store = z.uuid().safeParse(params.store).success ? params.store : undefined;
  const person = z.uuid().safeParse(params.person).success ? params.person : undefined;
  const page = Math.max(0, Math.min(100, Number.parseInt(params.page ?? '0', 10) || 0));
  return <PlatformShell active="activity">{async (viewer) => {
    const [items, stores, people] = await Promise.all([
      platformActivity(viewer.client, { limit: PAGE + 1, offset: page * PAGE, ...(store ? { store } : {}), ...(person ? { user: person } : {}) }),
      platformStores(viewer.client), platformPeople(viewer.client)]);
    const more = items.length > PAGE;
    const query = (next: number) => `/platform/activity?${new URLSearchParams({ ...(store ? { store } : {}), ...(person ? { person } : {}), page: String(next) })}`;
    return <main className="flex flex-col gap-6 px-4 py-7 md:px-8">
      <h1 className="m-0 text-3xl">{t('platform.activity.title')}</h1>
      <form method="get" className="panel-card flex flex-wrap items-end gap-4 p-4">
        <label className="flex min-w-[220px] flex-1 flex-col font-semibold">{t('platform.table.store')}
          <select name="store" defaultValue={store ?? ''} className="auth-input font-normal">
            <option value="">{t('platform.activity.allStores')}</option>
            {stores.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="flex min-w-[220px] flex-1 flex-col font-semibold">{t('platform.people')}
          <select name="person" defaultValue={person ?? ''} className="auth-input font-normal">
            <option value="">{t('platform.activity.allPeople')}</option>
            {people.map((item) => <option key={item.id} value={item.id}>{item.full_name || item.email}</option>)}</select></label>
        <button type="submit" className="auth-secondary">{t('platform.activity.filter')}</button>
      </form>
      <Panel title={t('platform.activity.title')}>
        <ActivityList items={items.slice(0, PAGE)} empty={t('platform.activity.empty')} />
      </Panel>
      {(page > 0 || more) && <nav aria-label={t('platform.activity.title')} className="flex gap-3">
        {page > 0 && <a className="auth-secondary" href={query(page - 1)}>←</a>}
        {more && <a className="auth-secondary" href={query(page + 1)}>{t('platform.activity.more')}</a>}
      </nav>}
    </main>;
  }}</PlatformShell>;
}
