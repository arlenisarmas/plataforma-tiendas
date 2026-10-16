import Link from 'next/link';
import { AuthShell } from '../auth-shell';
import { loginAction, magicAction } from '../auth-actions';
import { adminText } from '../../lib/locale';

export default async function LoginPage({ searchParams }: {
  searchParams: Promise<{ error?: string; sent?: string; next?: string; paused?: string }>;
}) {
  const t = await adminText();
  const params = await searchParams;
  return <AuthShell title={t('signIn')} intro={t('login.intro')}>
    {params.error && <p role="alert" className="m-0 rounded-xl border border-[#6b2e36] bg-[#3b1a20] p-3 text-[#ff9aa5]">{t('authError')}</p>}
    {params.paused && <p role="alert" className="m-0 rounded-xl border border-[#6b2e36] bg-[#3b1a20] p-3 text-[#ff9aa5]">{t('login.suspended')}</p>}
    {params.sent && <p role="status" className="m-0 rounded-xl border border-[#2f7d5b] bg-[#173b2e] p-3 text-[#7ee2b3]">{t('checkEmail')}</p>}
    <form action={loginAction} className="flex flex-col gap-5">
      {params.next && <input type="hidden" name="next" value={params.next} />}
      <label className="block font-semibold">{t('email')}
        <input className="auth-input font-normal" type="email" name="email" autoComplete="email" placeholder="nombre@correo.com" required /></label>
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor="login-password" className="font-semibold">{t('password')}</label>
          <Link href="/forgot" className="text-sm">{t('login.forgot')}</Link>
        </div>
        <input id="login-password" className="auth-input" type="password" name="password" autoComplete="current-password" minLength={8} required />
      </div>
      <button className="auth-primary w-full text-base" type="submit">{t('signIn')}</button>
      <div aria-hidden="true" className="flex items-center gap-3 text-sm text-[#a3a9b8]">
        <span className="h-px flex-1 bg-[#2a2f3c]" />{t('login.or')}<span className="h-px flex-1 bg-[#2a2f3c]" /></div>
      <button className="auth-secondary w-full" type="submit" formAction={magicAction} formNoValidate>{t('login.magic')}</button>
    </form>
    <p className="m-0 rounded-xl border border-[#232733] bg-[#171a23] p-4 text-sm leading-relaxed text-[#a3a9b8]">{t('login.inviteHint')}</p>
  </AuthShell>;
}
