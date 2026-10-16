import Link from 'next/link';
import { adminText } from '../../lib/locale';
import { platformActivity, platformOverview, platformPresence, platformStores } from '../../lib/platform-data';
import { displayName } from '../../lib/viewer';
import { ActivityList, Panel, StoresTable } from './parts';
import { PlatformShell, timeIn } from './platform-shell';

export default async function PlatformHome() {
  const t = await adminText();
  return <PlatformShell active="home">{async (viewer) => {
    const [overview, presence, activity, stores] = await Promise.all([platformOverview(viewer.client),
      platformPresence(viewer.client), platformActivity(viewer.client, { limit: 6 }), platformStores(viewer.client)]);
    const kpis = [
      { label: t('platform.kpi.stores'), value: overview.stores, note: t('platform.kpi.storesNote', { count: overview.storesPublished }), tone: '#a3a9b8' },
      { label: t('platform.kpi.people'), value: overview.people, note: '', tone: '#a3a9b8' },
      { label: t('platform.kpi.workingNow'), value: overview.workingNow, note: `● ${t('platform.kpi.live')}`, tone: '#5fd39e' },
      { label: t('platform.kpi.ordersToday'), value: overview.ordersToday, note: overview.ordersPending ? t('platform.kpi.ordersPending', { count: overview.ordersPending }) : '', tone: '#f2b45a' },
      { label: t('platform.kpi.invitations'), value: overview.invitationsPending, note: '', tone: '#a3a9b8' },
    ];
    return <main className="flex flex-col gap-6 px-4 py-7 md:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm capitalize text-[#a3a9b8]">{timeIn(new Date().toISOString(), { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          <h1 className="m-0 text-3xl">{t('platform.hello', { name: displayName(viewer) })}</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/platform/invite" className="auth-secondary">{t('platform.invitePerson')}</Link>
          <Link href="/stores/new" className="auth-primary">+ {t('platform.createStore')}</Link>
        </div>
      </header>

      <section aria-label={t('platform.nav.home')} className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-4">
        {kpis.map((kpi) => <div key={kpi.label} className="panel-card flex flex-col gap-2 px-5 py-4">
          <span className="text-sm text-[#a3a9b8]">{kpi.label}</span>
          <div className="flex items-baseline gap-2.5">
            <strong className="text-[34px] font-extrabold tracking-tight">{kpi.value}</strong>
            {kpi.note && <span className="text-[13px]" style={{ color: kpi.tone }}>{kpi.note}</span>}
          </div>
        </div>)}
      </section>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(340px,1fr))] items-start gap-5">
        <Panel title={t('platform.working')} action={<Link href="/platform/hours" className="text-sm">{t('platform.seeHours')}</Link>}>
          {presence.length === 0 ? <p className="m-0 px-5 py-4 text-[#a3a9b8]">{t('platform.nobodyWorking')}</p>
            : <ul className="m-0 list-none p-0">{presence.map((person) => {
                const name = person.full_name || person.email.split('@')[0] || person.email;
                return <li key={person.user_id} className="flex items-center gap-3.5 border-b border-[#1f2330] px-5 py-3.5 last:border-0">
                  <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#3a3f7a] font-bold text-white">{name.charAt(0).toUpperCase()}</span>
                  <span className="flex min-w-0 flex-1 flex-col"><strong className="text-[15px]">{name}</strong>
                    <span className="truncate text-sm text-[#a3a9b8]">{person.store_name ?? t('platform.inConsole')}</span></span>
                  <span className="flex items-center gap-2 text-sm font-semibold"><span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-[#3fb37f]" />
                    {t('platform.since', { time: timeIn(person.started_at) })}</span>
                </li>;
              })}</ul>}
        </Panel>
        <Panel title={t('platform.recentActivity')} action={<Link href="/platform/activity" className="text-sm">{t('platform.seeAll')}</Link>}>
          <ActivityList items={activity} empty={t('platform.activity.empty')} />
        </Panel>
      </div>

      <Panel title={t('platform.stores')} action={<Link href="/platform/stores" className="text-sm">{t('platform.seeAll')}</Link>}>
        <StoresTable stores={stores} limit={8} />
      </Panel>
      <p className="m-0 text-[13px] text-[#a3a9b8]">{t('shell.activityNotice')}</p>
    </main>;
  }}</PlatformShell>;
}
