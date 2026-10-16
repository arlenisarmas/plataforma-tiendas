import Link from 'next/link';
import type { ReactNode } from 'react';
import { adminText } from '../../lib/locale';
import { currentViewer, displayName, touchPresence, type Viewer } from '../../lib/viewer';
import { ConsoleLayout } from '../console-layout';

export const platformSections = ['home', 'stores', 'people', 'invite', 'activity', 'hours'] as const;
const paths: Record<(typeof platformSections)[number], string> = {
  home: '/platform', stores: '/platform/stores', people: '/platform/people', invite: '/platform/invite',
  activity: '/platform/activity', hours: '/platform/hours',
};

/** Consola de plataforma (T-034): solo admins. El control es en el servidor, no solo ocultando el enlace. */
export async function PlatformShell({ active, children }: {
  active: (typeof platformSections)[number]; children: (viewer: Viewer) => ReactNode | Promise<ReactNode>;
}) {
  const [t, viewer] = await Promise.all([adminText(), currentViewer()]);
  if (!viewer.isAdmin) {
    return <main className="mx-auto flex max-w-xl flex-col gap-4 px-6 py-16">
      <h1 className="m-0 text-3xl">{t('platform.nav.home')}</h1>
      <p role="alert" className="m-0 rounded-xl border border-[#6b2e36] bg-[#3b1a20] p-4 text-[#ff9aa5]">{t('platform.forbidden')}</p>
      <Link href="/" className="auth-secondary self-start">{t('shell.mySpace')}</Link>
    </main>;
  }
  await touchPresence(viewer.client);
  const nav = platformSections.map((key) => ({ label: t(`platform.nav.${key}`), href: paths[key], active: key === active }));
  return <ConsoleLayout subtitle={t('platform.subtitle')} nav={nav} userName={displayName(viewer)} userRole={t('shell.admin')}>
    {await children(viewer)}
  </ConsoleLayout>;
}

export function timeIn(value: string | null, options: Intl.DateTimeFormatOptions = { timeStyle: 'short' }): string {
  if (!value) return '';
  return new Intl.DateTimeFormat('es-AR', { ...options, timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date(value));
}

export function ago(value: string | null, now = Date.now()): { minutes: number } | null {
  if (!value) return null;
  return { minutes: Math.max(0, Math.round((now - new Date(value).getTime()) / 60000)) };
}

export function relativeLabel(value: string | null, locale: string): string {
  if (!value) return '';
  const minutes = (new Date(value).getTime() - Date.now()) / 60000;
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (Math.abs(minutes) < 60) return format.format(Math.round(minutes), 'minute');
  if (Math.abs(minutes) < 60 * 24) return format.format(Math.round(minutes / 60), 'hour');
  return format.format(Math.round(minutes / 1440), 'day');
}
