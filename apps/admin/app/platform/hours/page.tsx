import Link from 'next/link';
import { Fragment } from 'react';
import { adminText } from '../../../lib/locale';
import { minutesLabel, periodRange, platformWorkHours } from '../../../lib/platform-data';
import { Panel } from '../parts';
import { PlatformShell } from '../platform-shell';

export default async function HoursPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const [t, { period }] = await Promise.all([adminText(), searchParams]);
  const kind = period === 'month' ? 'month' : 'week';
  const range = periodRange(kind);
  return <PlatformShell active="hours">{async (viewer) => {
    const rows = await platformWorkHours(viewer.client, range.from, range.to);
    const people = new Map<string, { name: string; total: number; rows: typeof rows }>();
    for (const row of rows) {
      const entry = people.get(row.user_id) ?? { name: row.full_name || row.email, total: 0, rows: [] };
      entry.total += row.minutes; entry.rows.push(row); people.set(row.user_id, entry);
    }
    const tab = (value: 'week' | 'month') => `inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold no-underline ${kind === value
      ? 'bg-[#2b2f55] text-[#e9ebf2]' : 'border border-[#2a2f3c] text-[#c9cdd8]'}`;
    return <main className="flex flex-col gap-6 px-4 py-7 md:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="m-0 text-3xl">{t('platform.hours.title')}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/platform/hours?period=week" aria-current={kind === 'week' ? 'page' : undefined} className={tab('week')}>{t('platform.hours.week')}</Link>
          <Link href="/platform/hours?period=month" aria-current={kind === 'month' ? 'page' : undefined} className={tab('month')}>{t('platform.hours.month')}</Link>
          <a href={`/platform/hours/export?period=${kind}`} className="auth-secondary ml-2" download>{t('platform.hours.export')}</a>
        </div>
      </header>
      <Panel title={`${t('platform.hours.title')} · ${range.from} – ${range.to}`}>
        {people.size === 0 ? <p className="m-0 px-5 py-4 text-[#a3a9b8]">{t('platform.hours.empty')}</p>
          : <div className="overflow-x-auto"><table className="w-full min-w-[560px] border-collapse text-[15px]">
              <thead><tr className="text-left text-[13px] text-[#a3a9b8]">
                <th scope="col" className="px-5 py-3 font-semibold">{t('platform.hours.person')}</th>
                <th scope="col" className="px-3 py-3 font-semibold">{t('platform.hours.store')}</th>
                <th scope="col" className="px-3 py-3 font-semibold">{t('platform.hours.time')}</th>
                <th scope="col" className="px-5 py-3 font-semibold">{t('platform.hours.sessions')}</th>
              </tr></thead>
              <tbody>{[...people.entries()].map(([id, person]) => <Fragment key={id}>
                {person.rows.map((row, index) => <tr key={`${id}-${row.store_id ?? 'space'}`} className={index === 0 ? 'border-t border-[#2a2f3c]' : ''}>
                  <td className="px-5 py-3">{index === 0 ? <strong>{person.name}</strong> : ''}</td>
                  <td className="px-3 py-3 text-[#c9cdd8]">{row.store_name ?? t('platform.hours.noStore')}</td>
                  <td className="px-3 py-3">{t('platform.hoursValue', minutesLabel(row.minutes))}</td>
                  <td className="px-5 py-3 text-[#c9cdd8]">{row.sessions}</td>
                </tr>)}
                <tr key={`${id}-total`} className="bg-[#13161e]">
                  <td className="px-5 py-2 text-sm text-[#a3a9b8]" colSpan={2}>{t('platform.hours.total')}</td>
                  <td className="px-3 py-2 font-bold" colSpan={2}>{t('platform.hoursValue', minutesLabel(person.total))}</td>
                </tr>
              </Fragment>)}</tbody>
            </table></div>}
      </Panel>
      <p className="m-0 text-[13px] text-[#a3a9b8]">{t('shell.activityNotice')}</p>
    </main>;
  }}</PlatformShell>;
}
