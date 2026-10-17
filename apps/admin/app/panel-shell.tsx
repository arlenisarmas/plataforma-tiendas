import type { ReactNode } from 'react';
import { adminText } from '../lib/locale';
import type { panelContext } from '../lib/panel-data';
import { currentViewer, displayName, touchPresence } from '../lib/viewer';
import { ConsoleLayout } from './console-layout';

type Context = Awaited<ReturnType<typeof panelContext>>;
const sections = ['home', 'products', 'orders', 'page', 'customers', 'settings'] as const;
const paths = ['/', '/products', '/orders', '/page', '/customers', '/settings'];
const tones: Record<string, string> = { published: 'success', draft: 'warning', suspended: 'danger' };

/** Estructura de las pantallas de una tienda: menú de la tienda y regreso a Mi espacio o a la consola. */
export async function PanelShell({ context, active, children }: { context: Context; active: string; children: ReactNode }) {
  const [t, viewer] = await Promise.all([adminText(), currentViewer()]);
  await touchPresence(context.client, context.selected.id);
  const storeId = context.selected.id;
  const nav = [
    { label: `← ${viewer.isAdmin ? t('shell.console') : t('shell.mySpace')}`, href: viewer.isAdmin ? '/platform' : '/' },
    ...sections.map((key, index) => ({ label: t(`nav.${key}`), href: `${paths[index]}?store=${storeId}`, active: active === key })),
  ];
  const status = context.selected.status;
  const extra = <div className="flex flex-col gap-3 rounded-xl border border-[#232733] bg-[#171a23] p-3">
    <div className="flex flex-col gap-1">
      <strong className="text-[15px]">{context.selected.name}</strong>
      <span className="panel-chip self-start" data-tone={tones[status] ?? 'neutral'}>
        {t.has(`shell.status.${status}`) ? t(`shell.status.${status}`) : status}</span>
    </div>
    {context.stores.length > 1 && <form action="/" method="get" className="flex flex-col gap-2">
      <label htmlFor="store-select" className="text-[13px] text-[#a3a9b8]">{t('selectStore')}</label>
      <select className="auth-input mt-0" id="store-select" name="store" defaultValue={storeId}>
        {context.stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}
      </select>
      <button className="auth-secondary min-w-0" type="submit">{t('openStore')}</button>
    </form>}
  </div>;
  return <ConsoleLayout subtitle={context.selected.name} nav={nav} userName={displayName(viewer)}
    userRole={viewer.isAdmin ? t('shell.admin') : t('shell.owner')} extra={extra}>
    {children}
  </ConsoleLayout>;
}
