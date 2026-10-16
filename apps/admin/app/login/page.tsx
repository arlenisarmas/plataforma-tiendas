import { AuthShell } from '../auth-shell';
import { loginAction, magicAction } from '../auth-actions';
import { adminText } from '../../lib/locale';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; sent?: string }> }) {
  const t = await adminText();
  const params = await searchParams;
  return <AuthShell title={t('signIn')}>
    {params.error && <p role="alert" className="text-red-800">{t('authError')}</p>}
    {params.sent && <p role="status">{t('checkEmail')}</p>}
    <form action={loginAction} className="space-y-4">
      <label className="block">{t('email')}<input className="auth-input" type="email" name="email" autoComplete="email" required /></label>
      <label className="block">{t('password')}<input className="auth-input" type="password" name="password" autoComplete="current-password" minLength={8} required /></label>
      <button className="auth-primary" type="submit">{t('signIn')}</button>
    </form>
    <form action={magicAction} className="space-y-4">
      <label className="block">{t('email')}<input className="auth-input" type="email" name="email" autoComplete="email" required /></label>
      <button className="auth-secondary" type="submit">{t('magicLink')}</button>
    </form>
    <p className="text-slate-600">{t('googleSoon')}</p>
    <nav className="flex flex-wrap gap-4"><Link href="/signup">{t('signUp')}</Link><Link href="/forgot">{t('forgotPassword')}</Link></nav>
  </AuthShell>;
}
import Link from 'next/link';
