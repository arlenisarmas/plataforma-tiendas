import { redirect } from 'next/navigation';
import { AuthShell } from '../auth-shell';
import { logoutAction, profileAction } from '../auth-actions';
import { adminText } from '../../lib/locale';
import { userClient } from '../../lib/server-client';

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ updated?: string; error?: string }> }) {
  const t = await adminText();
  const client = await userClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await client.from('profiles').select('full_name,text_scale,ui_mode,locale').eq('id', user.id).single();
  const params = await searchParams;
  return <AuthShell title={t('profile')}>
    {params.updated && <p role="status">{t('saved')}</p>}
    {params.error && <p role="alert">{t('saveError')}</p>}
    <form action={profileAction} className="space-y-4">
      <label className="block">{t('fullName')}<input className="auth-input" name="fullName" defaultValue={profile?.full_name ?? ''} maxLength={100} /></label>
      <label className="block">{t('textScale')}<select className="auth-input" name="textScale" defaultValue={profile?.text_scale ?? 100}>
        {[100, 125, 150].map((value) => <option key={value} value={value}>{value}%</option>)}
      </select></label>
      <label className="block">{t('uiMode')}<select className="auth-input" name="uiMode" defaultValue={profile?.ui_mode ?? 'simple'}>
        <option value="simple">{t('simple')}</option><option value="advanced">{t('advanced')}</option>
      </select></label>
      <label className="block">{t('language')}<select className="auth-input" name="locale" defaultValue={profile?.locale ?? 'es-419'}>
        <option value="es-419">{t('spanishLatam')}</option><option value="es-AR">{t('spanishArgentina')}</option><option value="en">{t('english')}</option>
      </select></label>
      <button className="auth-primary" type="submit">{t('saveProfile')}</button>
    </form>
    <form action={logoutAction}><button className="auth-secondary" type="submit">{t('signOut')}</button></form>
  </AuthShell>;
}
