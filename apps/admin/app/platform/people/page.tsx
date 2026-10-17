import Link from 'next/link';
import { z } from 'zod';
import { adminLocale, adminText } from '../../../lib/locale';
import { minutesLabel, periodRange, platformActivity, platformPeople, platformWorkHours } from '../../../lib/platform-data';
import { ActivityList } from '../parts';
import { PlatformShell, relativeLabel, timeIn } from '../platform-shell';
import { PermissionsForm } from './permissions-form';

const avatarColors = ['#3a3f7a', '#8a5a2b', '#2f7d6b', '#6a4c9c', '#2f5e8c', '#7d3036'];

export default async function PeoplePage({ searchParams }: { searchParams: Promise<{ person?: string }> }) {
  const [t, locale, { person }] = await Promise.all([adminText(), adminLocale(), searchParams]);
  return <PlatformShell active="people">{async (viewer) => {
    const people = await platformPeople(viewer.client);
    const selectedId = z.uuid().safeParse(person).success ? person : undefined;
    const selected = people.find((item) => item.id === selectedId);
    const week = periodRange('week');
    const [hours, activity] = selected ? await Promise.all([
      platformWorkHours(viewer.client, week.from, week.to),
      platformActivity(viewer.client, { limit: 5, user: selected.id }),
    ]) : [[], []];
    const weekMinutes = hours.filter((row) => row.user_id === selected?.id).reduce((sum, row) => sum + row.minutes, 0);
    const role = (item: (typeof people)[number]) => item.is_admin ? { label: t('platform.roleAdmin'), tone: 'neutral' }
      : item.stores.some((store) => store.role === 'owner') ? { label: t('platform.roleOwner'), tone: 'warning' }
      : item.stores.length ? { label: t('platform.roleStaff'), tone: 'success' } : { label: t('platform.roleNone'), tone: 'neutral' };
    const online = (value: string | null) => Boolean(value && Date.now() - new Date(value).getTime() < 5 * 60_000);
    const nameOf = (item: (typeof people)[number]) => item.full_name || item.email.split('@')[0] || item.email;
    return <main className="flex flex-col gap-6 px-4 py-7 md:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-[#a3a9b8]">{t('platform.peopleCount', { count: people.length })}</span>
          <h1 className="m-0 text-3xl">{t('platform.people')}</h1>
        </div>
        <Link href="/platform/invite" className="auth-primary">{t('platform.invitePerson')}</Link>
      </header>
      <div className="flex flex-wrap items-start gap-5">
        <section aria-label={t('platform.people')} className="panel-card min-w-0 flex-[3_1_520px] overflow-hidden">
          <ul className="m-0 list-none p-0">{people.map((item, index) => {
            const r = role(item);
            return <li key={item.id}>
              <a href={`/platform/people?person=${item.id}`} aria-current={item.id === selected?.id ? 'true' : undefined}
                className="flex items-center gap-3.5 border-b border-[#1f2330] px-5 py-3.5 text-[#e9ebf2] no-underline hover:bg-[#1d212c] aria-[current=true]:bg-[#1f2440]">
                <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-bold text-white" style={{ background: avatarColors[index % avatarColors.length] }}>
                  {nameOf(item).charAt(0).toUpperCase()}</span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <strong className="flex items-center gap-2 text-[15px]">{nameOf(item)}
                    {online(item.last_seen_at) && <span className="h-2 w-2 rounded-full bg-[#3fb37f]" aria-label={t('platform.now')} />}
                    {item.status === 'suspended' && <span className="panel-chip" data-tone="danger">{t('platform.paused')}</span>}</strong>
                  <span className="truncate text-sm text-[#a3a9b8]">{item.stores.map((store) => store.name).join(' · ') || item.email}</span>
                </span>
                <span className="panel-chip hidden sm:inline-flex" data-tone={r.tone}>{r.label}</span>
                <span className="hidden w-28 text-right text-[13px] text-[#a3a9b8] md:block">
                  {item.last_seen_at ? (online(item.last_seen_at) ? t('platform.now') : relativeLabel(item.last_seen_at, locale)) : t('platform.never')}</span>
              </a>
            </li>;
          })}</ul>
        </section>
        <aside aria-label={selected ? nameOf(selected) : t('platform.selectPerson')} className="panel-card flex min-w-0 flex-[2_1_360px] flex-col gap-6 p-6">
          {!selected ? <p className="m-0 text-[#a3a9b8]">{t('platform.selectPerson')}</p> : <>
            <div className="flex items-center gap-4">
              <span aria-hidden="true" className="flex h-16 w-16 items-center justify-center rounded-full bg-[#3a3f7a] text-2xl font-extrabold text-white">{nameOf(selected).charAt(0).toUpperCase()}</span>
              <div className="flex min-w-0 flex-col gap-1">
                <h2 className="m-0 text-[22px]">{nameOf(selected)}</h2>
                <span className="truncate text-sm text-[#a3a9b8]">{selected.email}</span>
                <span className="text-sm text-[#a3a9b8]">{selected.last_seen_at ? t('platform.lastSeen', { when: relativeLabel(selected.last_seen_at, locale) }) : t('platform.never')}</span>
              </div>
            </div>
            {!selected.is_admin && <div className="flex flex-col gap-1">
              <h3 className="m-0 mb-1 text-[15px] font-semibold text-[#a3a9b8]">{t('platform.permissions')}</h3>
              <PermissionsForm key={selected.id} userId={selected.id} self={selected.id === viewer.userId}
                initial={{ canCreate: selected.can_create_stores, maxStores: selected.max_stores, paused: selected.status === 'suspended' }}
                labels={{ canCreate: t('platform.canCreate'), canCreateHelp: t('platform.canCreateHelp'), maxStores: t('platform.maxStores'),
                  paused: t('platform.paused'), pausedHelp: t('platform.pausedHelp'), save: t('platform.savePermissions'),
                  saved: t('platform.saved'), error: t('platform.saveError') }} />
            </div>}
            <div className="flex flex-col gap-2.5">
              <h3 className="m-0 text-[15px] font-semibold text-[#a3a9b8]">{t('platform.storesAndRole')}</h3>
              {selected.stores.length === 0 ? <p className="m-0 text-sm text-[#a3a9b8]">{t('platform.roleNone')}</p>
                : selected.stores.map((store) => <a key={store.id} href={`/?store=${store.id}`}
                    className="flex items-center justify-between rounded-xl bg-[#1d212c] px-3.5 py-3 text-[#e9ebf2] no-underline">
                    <strong className="text-[15px]">{store.name}</strong>
                    <span className={`text-sm ${store.role === 'owner' ? 'text-[#f5c77a]' : 'text-[#afb4ff]'}`}>
                      {store.role === 'owner' ? t('platform.roleOwner') : t('platform.roleStaff')}</span></a>)}
            </div>
            <div className="flex items-baseline justify-between">
              <h3 className="m-0 text-[15px] font-semibold text-[#a3a9b8]">{t('platform.hoursWeek')}</h3>
              <strong className="text-[22px]">{t('platform.hoursValue', minutesLabel(weekMinutes))}</strong>
            </div>
            <div className="-mx-6 -mb-6 border-t border-[#232733]">
              <h3 className="m-0 px-5 pt-4 text-[15px] font-semibold text-[#a3a9b8]">{t('platform.hisActivity')}</h3>
              <ActivityList items={activity} empty={t('platform.activity.empty')} />
            </div>
          </>}
        </aside>
      </div>
      <p className="m-0 text-[13px] text-[#a3a9b8]">{timeIn(new Date().toISOString(), { dateStyle: 'medium' })} · {t('shell.activityNotice')}</p>
    </main>;
  }}</PlatformShell>;
}
