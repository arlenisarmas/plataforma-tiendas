import { AuthShell } from '../../auth-shell';
import { resetAction } from '../../auth-actions';
import { adminText } from '../../../lib/locale';

export default async function NewPasswordPage() {
  const t = await adminText();
  return <AuthShell title={t('newPassword')}>
    <form action={resetAction} className="space-y-4">
      <label className="block">{t('password')}<input className="auth-input" type="password" name="password" autoComplete="new-password" minLength={8} required /></label>
      <button className="auth-primary" type="submit">{t('savePassword')}</button>
    </form>
  </AuthShell>;
}
