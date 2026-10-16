import Link from 'next/link';
import { adminText } from '../../lib/locale';
import { invitationEmail, type InvitationKind } from '../../lib/join';
import { userClient } from '../../lib/server-client';
import { AuthShell } from '../auth-shell';
import { logoutAction } from '../auth-actions';
import { acceptJoin } from './actions';
import { JoinForm } from './join-form';

/** Pantalla común para aceptar invitaciones de plataforma (/join) y de tienda (/invite). */
export async function JoinView({ kind, token, error }: { kind: InvitationKind; token: string; error?: boolean }) {
  const t = await adminText();
  const invitation = await invitationEmail(kind, token);
  const loginHref = `/login?next=${encodeURIComponent(`${kind === 'platform' ? '/join' : '/invite'}/${token}`)}`;
  if (!invitation || error) {
    return <AuthShell title={t('join.title')}>
      <p role="alert" className="m-0 rounded-xl border border-[#6b2e36] bg-[#3b1a20] p-4 text-[#ff9aa5]">{t('join.invalid')}</p>
      <Link href="/login" className="auth-secondary self-start">{t('join.backToLogin')}</Link>
    </AuthShell>;
  }
  const { data: { user } } = await (await userClient()).auth.getUser();
  if (user) {
    const same = (user.email ?? '').toLowerCase() === invitation.email;
    return <AuthShell title={t('join.title')} intro={t('join.loggedAs', { email: user.email ?? '' })}>
      {same ? <form action={acceptJoin}>
          <input type="hidden" name="kind" value={kind} /><input type="hidden" name="token" value={token} />
          <button className="auth-primary w-full" type="submit">{t('join.accept')}</button>
        </form>
        : <>
          <p role="alert" className="m-0 rounded-xl border border-[#6b4a1f] bg-[#3d3115] p-4 text-[#f5c77a]">{t('join.otherEmail', { email: invitation.email })}</p>
          <form action={logoutAction}><button className="auth-secondary" type="submit">{t('join.signOut')}</button></form>
        </>}
    </AuthShell>;
  }
  return <AuthShell title={t('join.title')} intro={t('join.intro', { email: invitation.email })}>
    <JoinForm kind={kind} token={token} defaultName={invitation.fullName ?? ''} loginHref={loginHref}
      labels={{ fullName: t('join.fullName'), password: t('join.password'), passwordHelp: t('join.passwordHelp'),
        create: t('join.create'), exists: t('join.exists'), signIn: t('join.signIn'), error: t('join.error'), invalid: t('join.invalid') }} />
  </AuthShell>;
}
