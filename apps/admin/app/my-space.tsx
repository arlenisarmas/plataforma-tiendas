import Link from 'next/link';
import { adminText } from '../lib/locale';
import { activityKey, mySpaceData, type SpaceProject } from '../lib/my-space';
import { displayName, touchPresence, type Viewer } from '../lib/viewer';
import { ConsoleLayout } from './console-layout';

const stepHref: Record<SpaceProject['missing'][number], string> = {
  page: '/page/edit', product: '/products/new', payment: '/settings', shipping: '/settings', logo: '/page', publish: '/publish',
};
const tones: Record<string, string> = { published: 'success', draft: 'warning', suspended: 'danger' };
const covers = ['#2a2245', '#1f3a35', '#3a2a1f', '#1f2c45', '#3a1f2c'];

function storefrontHref(project: SpaceProject): string {
  const base = (process.env.NEXT_PUBLIC_STOREFRONT_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  return project.status === 'published' ? `${base}/?tienda=${project.slug}` : `/page/edit?store=${project.id}`;
}

/** «Mi espacio»: lo que ve cada persona invitada al entrar (solo lo suyo). */
export async function MySpace({ viewer }: { viewer: Viewer }) {
  const [t, data] = await Promise.all([adminText(), mySpaceData(viewer)]);
  await touchPresence(viewer.client);
  const name = displayName(viewer);
  const remaining = Math.max(0, viewer.maxStores - data.owned);
  const canCreate = viewer.canCreateStores && remaining > 0;
  const blockedText = !viewer.canCreateStores ? t('space.noPermission') : remaining === 0 ? t('space.quotaFull') : null;
  const nav = [
    { label: t('nav.home'), href: '/', active: true },
    { label: t('space.myData'), href: '/profile' },
  ];
  const textSize = data.profile.text_scale > 100 ? t('space.large', { value: data.profile.text_scale }) : t('space.normal');
  const languages: Record<string, string> = { 'es-419': t('spanishLatam'), 'es-AR': t('spanishArgentina'), en: t('english') };
  return <ConsoleLayout subtitle={t('shell.mySpace')} nav={nav} userName={name}
    userRole={data.owned > 0 ? t('shell.owner') : t('shell.member')}>
    <main className="flex flex-col gap-6 px-4 py-7 md:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-[#a3a9b8]">{t('space.welcome')}</span>
          <h1 className="m-0 text-3xl">{t('space.hello', { name })}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {viewer.canCreateStores && <span className="text-sm text-[#c9cdd8]">{t('space.quota', { used: data.owned, max: viewer.maxStores })}</span>}
          {canCreate
            ? <Link href="/stores/new" className="auth-primary">+ {t('space.newProject')}</Link>
            : <span className="text-sm text-[#a3a9b8]">{blockedText}</span>}
        </div>
      </header>

      <section aria-labelledby="projects-heading" className="flex flex-col gap-4">
        <h2 id="projects-heading" className="sr-only">{t('space.projects')}</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5">
          {data.projects.map((project, index) => <article key={project.id} className="panel-card flex flex-col overflow-hidden">
            <div className="flex h-28 items-end p-4" style={{ background: covers[index % covers.length] }}>
              <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-2xl border-[3px] border-[#171a23] bg-[#5b5fe0] text-2xl font-extrabold text-white">
                {project.name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex flex-col gap-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1">
                  <h3 className="m-0 truncate text-lg font-extrabold">{project.name}</h3>
                  <span className="text-sm text-[#a3a9b8]">{project.country_code} · {project.currency} · {project.role === 'owner' ? t('space.roleOwner') : t('space.roleStaff')}</span>
                </div>
                <span className="panel-chip shrink-0" data-tone={tones[project.status] ?? 'neutral'}>
                  {t.has(`shell.status.${project.status}`) ? t(`shell.status.${project.status}`) : project.status}</span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm"><span className="text-[#c9cdd8]">{t('space.ready')}</span><strong>{project.percent}%</strong></div>
                <div className="h-2 overflow-hidden rounded bg-[#262a36]" role="progressbar" aria-valuenow={project.percent} aria-valuemin={0} aria-valuemax={100} aria-label={t('space.ready')}>
                  <div className="h-2 bg-[#7c80f2]" style={{ width: `${project.percent}%` }} /></div>
              </div>
              {project.missing.length > 0
                ? <div className="flex flex-col gap-2 text-sm">
                    <span className="font-semibold text-[#a3a9b8]">{t('space.missing')}</span>
                    <ul className="m-0 flex list-none flex-col gap-1 p-0">{project.missing.slice(0, 3).map((key) =>
                      <li key={key}><a href={`${stepHref[key]}?store=${project.id}`} className="flex min-h-11 items-center gap-3 text-[#e9ebf2] no-underline hover:underline">
                        <span aria-hidden="true" className="h-[18px] w-[18px] shrink-0 rounded-full border-2 border-[#3a3f55]" />{t(`space.steps.${key}`)}</a></li>)}
                    </ul>
                  </div>
                : <p className="m-0 text-sm text-[#7ee2b3]">{t('space.allDone')}</p>}
              <div className="flex flex-wrap gap-3">
                <a href={`/build?store=${project.id}`} className="auth-primary min-w-0">{t('space.continue')}</a>
                <a href={`/?store=${project.id}`} className="auth-secondary min-w-0">{t('space.manage')}</a>
                <a href={storefrontHref(project)} className="flex min-h-11 items-center text-[15px]">{t('space.view')}</a>
              </div>
            </div>
          </article>)}
          {canCreate && <Link href="/stores/new" className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#3a3f55] p-6 text-center text-[#c9cdd8] no-underline hover:bg-[#13161e]">
            <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-full bg-[#232850] text-3xl text-[#afb4ff]">+</span>
            <strong className="text-lg text-[#e9ebf2]">{t('space.createCard')}</strong>
            <span className="text-sm">{t('space.remaining', { count: remaining })}</span>
          </Link>}
          {data.projects.length === 0 && !canCreate && <div className="panel-card flex flex-col gap-2 p-6">
            <strong className="text-lg">{t('space.empty')}</strong><p className="m-0 text-[#a3a9b8]">{t('space.emptyHelp')}</p></div>}
        </div>
      </section>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-start gap-5">
        <section aria-labelledby="data-heading" className="panel-card flex flex-col gap-4 p-5">
          <h2 id="data-heading" className="m-0 text-lg">{t('space.myData')}</h2>
          <dl className="m-0 grid grid-cols-2 gap-4 text-[15px]">
            <div className="flex flex-col gap-1"><dt className="text-[13px] text-[#a3a9b8]">{t('space.name')}</dt><dd className="m-0">{name}</dd></div>
            <div className="flex min-w-0 flex-col gap-1"><dt className="text-[13px] text-[#a3a9b8]">{t('space.email')}</dt><dd className="m-0 truncate">{viewer.email}</dd></div>
            <div className="flex flex-col gap-1"><dt className="text-[13px] text-[#a3a9b8]">{t('space.language')}</dt><dd className="m-0">{languages[data.profile.locale] ?? data.profile.locale}</dd></div>
            <div className="flex flex-col gap-1"><dt className="text-[13px] text-[#a3a9b8]">{t('space.textSize')}</dt><dd className="m-0">{textSize}</dd></div>
          </dl>
          <Link href="/profile" className="self-start font-semibold">{t('space.editData')}</Link>
        </section>
        <section aria-labelledby="recent-heading" className="panel-card overflow-hidden">
          <h2 id="recent-heading" className="m-0 border-b border-[#232733] px-5 py-4 text-lg">{t('space.recent')}</h2>
          {data.recent.length === 0 ? <p className="m-0 px-5 py-4 text-[#a3a9b8]">{t('space.noRecent')}</p>
            : <ul className="m-0 list-none p-0">{data.recent.map((item) => <li key={item.id} className="border-b border-[#1f2330] px-5 py-3 text-[15px] last:border-0">
                <time dateTime={item.created_at} className="block text-[13px] text-[#a3a9b8]">
                  {new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date(item.created_at))}</time>
                {t.has(`activity.${activityKey(item.action)}`) ? t(`activity.${activityKey(item.action)}`) : t('activity.other')} {item.storeName && <strong>{item.storeName}</strong>}
              </li>)}</ul>}
        </section>
      </div>
      <p className="m-0 text-[13px] text-[#a3a9b8]">{t('space.footer')}</p>
    </main>
  </ConsoleLayout>;
}
