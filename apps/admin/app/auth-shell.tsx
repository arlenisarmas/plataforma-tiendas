import type { ReactNode } from 'react';
import { adminText } from '../lib/locale';

/** Pantallas de acceso (ingreso, recuperar contraseña, invitaciones): marca a la izquierda, formulario a la derecha. */
export async function AuthShell({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  const t = await adminText();
  const benefits = t.raw('login.benefits') as string[];
  return <div className="flex min-h-screen flex-wrap">
    <section aria-label={t('login.brandLabel')}
      className="flex min-w-0 flex-[1_1_100%] flex-col justify-between gap-10 border-b border-[#232733] bg-[#13161e] px-6 py-5 md:flex-[1_1_420px] md:border-r md:border-b-0 md:p-12">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#5b5fe0] text-xl font-extrabold text-white">
          {t('login.brand').charAt(0)}</span>
        <strong className="text-lg">{t('login.brand')}</strong>
      </div>
      <div className="hidden max-w-[460px] flex-col gap-5 md:flex">
        <p className="m-0 text-4xl font-extrabold leading-tight tracking-tight md:text-[44px]">{t('login.tagline')}</p>
        <p className="m-0 text-[17px] leading-relaxed text-[#c9cdd8]">{t('login.subtitle')}</p>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">{benefits.map((item) =>
          <li key={item} className="flex items-center gap-3 text-[15px] text-[#c9cdd8]">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#8c90ff]" />{item}</li>)}
        </ul>
      </div>
      <p className="m-0 hidden text-sm text-[#a3a9b8] md:block">{t('login.inviteOnly')}</p>
    </section>
    <main className="flex min-w-0 flex-[1_1_420px] items-start justify-center px-6 py-8 md:items-center md:py-12">
      <div className="flex w-full max-w-[400px] flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h1 className="m-0 text-3xl">{title}</h1>
          {intro && <p className="m-0 text-[15px] text-[#a3a9b8]">{intro}</p>}
        </div>
        {children}
      </div>
    </main>
  </div>;
}
