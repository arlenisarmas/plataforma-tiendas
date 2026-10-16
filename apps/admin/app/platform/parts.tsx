import { adminLocale, adminText } from '../../lib/locale';
import { activityKey } from '../../lib/my-space';
import { setStoreSuspended } from './actions';
import { relativeLabel, timeIn } from './platform-shell';

type StoreRow = { id: string; name: string; slug: string; status: string; country_code: string; currency: string;
  owners: string | null; products: number; orders: number; last_activity: string | null };
type ActivityRow = { id: number; created_at: string; actor_name: string | null; store_name: string | null; action: string };

const tones: Record<string, string> = { published: 'success', draft: 'warning', suspended: 'danger' };
const colors = ['#8a5a2b', '#7d3036', '#6a4c9c', '#2f5e8c', '#2f7d6b'];

export async function StoresTable({ stores, limit }: { stores: StoreRow[]; limit?: number }) {
  const [t, locale] = await Promise.all([adminText(), adminLocale()]);
  const rows = limit ? stores.slice(0, limit) : stores;
  if (rows.length === 0) return <p className="m-0 px-5 py-4 text-[#a3a9b8]">{t('platform.noStores')}</p>;
  return <div className="overflow-x-auto">
    <table className="w-full min-w-[760px] border-collapse text-[15px]">
      <thead><tr className="text-left text-[13px] text-[#a3a9b8]">
        <th scope="col" className="px-5 py-3 font-semibold">{t('platform.table.store')}</th>
        <th scope="col" className="px-3 py-3 font-semibold">{t('platform.table.owner')}</th>
        <th scope="col" className="px-3 py-3 font-semibold">{t('platform.table.status')}</th>
        <th scope="col" className="px-3 py-3 font-semibold">{t('platform.table.products')}</th>
        <th scope="col" className="px-3 py-3 font-semibold">{t('platform.table.orders')}</th>
        <th scope="col" className="px-3 py-3 font-semibold">{t('platform.table.updated')}</th>
        <th scope="col" className="px-5 py-3 font-semibold"><span className="sr-only">{t('platform.table.actions')}</span></th>
      </tr></thead>
      <tbody>{rows.map((store, index) => <tr key={store.id} className="border-t border-[#1f2330]">
        <td className="px-5 py-3.5"><div className="flex items-center gap-3">
          <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] font-extrabold text-white" style={{ background: colors[index % colors.length] }}>
            {store.name.charAt(0).toUpperCase()}</span>
          <span className="flex flex-col"><strong>{store.name}</strong><span className="text-[13px] text-[#a3a9b8]">{store.country_code} · {store.currency}</span></span>
        </div></td>
        <td className="px-3 py-3.5">{store.owners ?? <span className="text-[#a3a9b8]">{t('platform.noOwner')}</span>}</td>
        <td className="px-3 py-3.5"><span className="panel-chip" data-tone={tones[store.status] ?? 'neutral'}>
          {t.has(`shell.status.${store.status}`) ? t(`shell.status.${store.status}`) : store.status}</span></td>
        <td className="px-3 py-3.5">{store.products}</td>
        <td className="px-3 py-3.5">{store.orders}</td>
        <td className="px-3 py-3.5 text-[#c9cdd8]">{relativeLabel(store.last_activity, locale)}</td>
        <td className="px-5 py-3.5"><div className="flex items-center justify-end gap-2">
          <a href={`/?store=${store.id}`} className="auth-secondary min-h-10 min-w-0 px-4 text-sm">{t('platform.enter')}</a>
          <form action={setStoreSuspended}>
            <input type="hidden" name="storeId" value={store.id} />
            <input type="hidden" name="suspended" value={store.status === 'suspended' ? 'false' : 'true'} />
            <button type="submit" className="min-h-10 rounded-lg px-3 text-sm text-[#afb4ff] underline">
              {store.status === 'suspended' ? t('platform.reactivate') : t('platform.suspend')}</button>
          </form>
        </div></td>
      </tr>)}</tbody>
    </table>
  </div>;
}

export async function ActivityList({ items, empty }: { items: ActivityRow[]; empty: string }) {
  const t = await adminText();
  if (items.length === 0) return <p className="m-0 px-5 py-4 text-[#a3a9b8]">{empty}</p>;
  return <ul className="m-0 list-none p-0">{items.map((item) => <li key={item.id} className="flex gap-4 border-b border-[#1f2330] px-5 py-3 last:border-0">
    <time dateTime={item.created_at} className="w-24 shrink-0 pt-0.5 text-[13px] text-[#a3a9b8]">
      {timeIn(item.created_at, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</time>
    <span className="text-[15px] leading-relaxed"><strong>{item.actor_name ?? t('platform.activity.someone')}</strong>{' '}
      {t.has(`activity.${activityKey(item.action)}`) ? t(`activity.${activityKey(item.action)}`) : t('activity.other')}
      {item.store_name && <> <span className="text-[#afb4ff]">{item.store_name}</span></>}</span>
  </li>)}</ul>;
}

export function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <section className="panel-card overflow-hidden">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#232733] px-5 py-4">
      <h2 className="m-0 text-[17px]">{title}</h2>{action}
    </div>
    {children}
  </section>;
}
