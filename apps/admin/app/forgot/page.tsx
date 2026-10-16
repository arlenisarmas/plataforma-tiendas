import { AuthShell } from '../auth-shell';
import { forgotAction } from '../auth-actions';
import { adminText } from '../../lib/locale';

export default async function ForgotPage() {
  const t = await adminText();
  return <AuthShell title={t('forgotPassword')}>
    <p>{t('resetIntro')}</p><form action={forgotAction} className="space-y-4">
      <label className="block">{t('email')}<input className="auth-input" type="email" name="email" autoComplete="email" required /></label>
      <button className="auth-primary" type="submit">{t('sendReset')}</button>
    </form><Link href="/login">{t('backToLogin')}</Link>
  </AuthShell>;
}
import Link from 'next/link';
