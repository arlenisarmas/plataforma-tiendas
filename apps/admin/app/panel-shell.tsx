import type { ReactNode } from 'react';
import { adminText } from '../lib/locale';
import type { panelContext } from '../lib/panel-data';

type Context = Awaited<ReturnType<typeof panelContext>>;
const sections = ['home', 'products', 'orders', 'page', 'customers', 'settings'] as const;
const paths = ['/', '/products', '/orders', '/page', '/customers', '/settings'];

export async function PanelShell({ context, active, children }: { context: Context; active: string; children: ReactNode }) {
  const t = await adminText();
  return <div className="mx-auto min-h-screen max-w-7xl md:grid md:grid-cols-[12rem_1fr]">
    <aside className="hidden border-r border-slate-200 p-4 md:block">
      <p className="mb-5 font-bold">{context.selected.name}</p>
      <nav aria-label={t('navLabel')} className="flex flex-col gap-2">{sections.map((key, index) =>
        <a key={key} aria-current={active === key ? 'page' : undefined} className="min-h-11 rounded-lg px-3 py-2 aria-[current=page]:bg-sky-100"
          href={`${paths[index]}?store=${context.selected.id}`}>{t(`nav.${key}`)}</a>)}</nav>
    </aside>
    <div className="min-w-0 pb-24 md:pb-0">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
        <strong>{context.selected.name}</strong>
        {context.stores.length > 1 && <form action="/" method="get"><label htmlFor="store-select">{t('selectStore')}</label>
          <select className="auth-input" id="store-select" name="store" defaultValue={context.selected.id}>
            {context.stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}
          </select><button className="auth-secondary mt-2" type="submit">{t('openStore')}</button></form>}
      </header>
      {children}
    </div>
    <nav aria-label={t('navLabel')} className="fixed inset-x-0 bottom-0 z-10 flex gap-2 overflow-x-auto border-t border-slate-300 bg-white p-2 md:hidden">
      {sections.map((key, index) => <a key={key} href={`${paths[index]}?store=${context.selected.id}`}
        aria-current={active === key ? 'page' : undefined}
        className="flex min-h-11 shrink-0 items-center rounded-lg px-3 text-base aria-[current=page]:bg-sky-100">{t(`nav.${key}`)}</a>)}
    </nav>
  </div>;
}
