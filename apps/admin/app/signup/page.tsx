import { AuthShell } from '../auth-shell';
import { signupAction } from '../auth-actions';
import { adminText } from '../../lib/locale';

export default async function SignupPage() {
  const t = await adminText();
  return <AuthShell title={t('signUp')}>
    <form action={signupAction} className="space-y-4">
      <label className="block">{t('email')}<input className="auth-input" type="email" name="email" autoComplete="email" required /></label>
      <label className="block">{t('password')}<input className="auth-input" type="password" name="password" autoComplete="new-password" minLength={8} required /></label>
      <button className="auth-primary" type="submit">{t('createAccount')}</button>
    </form><Link href="/login">{t('backToLogin')}</Link>
  </AuthShell>;
}
import Link from 'next/link';
