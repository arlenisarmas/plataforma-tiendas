import { AuthShell } from '../auth-shell';
import { guideAction } from '../auth-actions';
import { adminText } from '../../lib/locale';

export default async function WelcomePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const t = await adminText();
  return <AuthShell title={t('welcome')}>
    <p>{t('guideQuestion')}</p>
    {(await searchParams).error && <p role="alert">{t('saveError')}</p>}
    <form action={guideAction}><input type="hidden" name="guided" value="yes" />
      <button className="auth-primary" type="submit">{t('guideYes')}</button></form>
    <form action={guideAction}><input type="hidden" name="guided" value="no" />
      <button className="auth-secondary" type="submit">{t('guideNo')}</button></form>
  </AuthShell>;
}
