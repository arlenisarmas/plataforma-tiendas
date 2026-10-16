import type { ReactNode } from 'react';
import { adminText } from '../lib/locale';
import { logoutAction } from './auth-actions';

export type NavItem = { label: string; href: string; active?: boolean };

/** Estructura de consola (T-037): barra lateral en computadora y menú desplegable en celular. */
export async function ConsoleLayout({ subtitle, nav, userName, userRole, children, extra }: {
  subtitle: string; nav: NavItem[]; userName: string; userRole: string; children: ReactNode; extra?: ReactNode;
}) {
  const t = await adminText();
  const initial = userName.charAt(0).toUpperCase() || '·';
  const links = (className: string) => nav.map((item) =>
    <a key={item.href + item.label} href={item.href} aria-current={item.active ? 'page' : undefined} className={className}>
      <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${item.active ? 'bg-[#afb4ff]' : 'bg-[#3a3f55]'}`} />
      {item.label}</a>);
  const navLinkClass = 'flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-[15px] font-medium text-[#c9cdd8] no-underline hover:bg-[#1d212c] aria-[current=page]:bg-[#232850] aria-[current=page]:font-bold aria-[current=page]:text-white';
  const brand = <div className="flex items-center gap-3 px-2">
    <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5b5fe0] text-lg font-extrabold text-white">
      {t('login.brand').charAt(0)}</span>
    <span className="flex flex-col"><strong className="text-base">{t('login.brand')}</strong>
      <span className="text-[13px] text-[#a3a9b8]">{subtitle}</span></span>
  </div>;
  const user = <div className="flex items-center gap-3 rounded-xl bg-[#1a1e28] p-3">
    <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3a3f7a] font-bold text-white">{initial}</span>
    <span className="flex min-w-0 flex-1 flex-col"><strong className="truncate text-[15px]">{userName}</strong>
      <span className="text-[13px] text-[#a3a9b8]">{userRole}</span></span>
    <form action={logoutAction}><button type="submit" className="min-h-11 rounded-lg px-2 text-sm text-[#afb4ff] underline">{t('shell.signOut')}</button></form>
  </div>;
  return <div className="flex min-h-screen flex-wrap items-stretch bg-[#0e1016]">
    <aside className="hidden min-w-0 flex-[1_1_232px] flex-col gap-7 border-r border-[#232733] bg-[#13161e] px-4 py-6 md:flex md:max-w-[260px]">
      {brand}
      <nav aria-label={t('navLabel')} className="flex flex-col gap-1">{links(navLinkClass)}</nav>
      {extra}
      <div className="mt-auto">{user}</div>
    </aside>
    <div className="flex w-full items-center justify-between gap-3 border-b border-[#232733] bg-[#13161e] px-4 py-3 md:hidden">
      {brand}
      <details className="relative">
        <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-xl border border-[#2a2f3c] px-4 font-semibold">{t('shell.menu')}</summary>
        <div className="absolute right-0 z-20 mt-2 flex w-72 flex-col gap-2 rounded-2xl border border-[#2a2f3c] bg-[#171a23] p-3 shadow-2xl">
          <nav aria-label={t('navLabel')} className="flex flex-col gap-1">{links(navLinkClass)}</nav>
          {extra}
          {user}
        </div>
      </details>
    </div>
    <div className="min-w-0 flex-[999_1_560px]">{children}</div>
  </div>;
}
