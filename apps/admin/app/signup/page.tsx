import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthShell } from '../auth-shell';
import { adminText } from '../../lib/locale';
import { tokenPattern } from '../../lib/join';

/** El registro abierto está cerrado (T-035): solo se entra con una invitación. */
export default async function SignupPage({ searchParams }: { searchParams: Promise<{ invite?: string }> }) {
  const { invite } = await searchParams;
  if (invite && tokenPattern.test(invite)) redirect(`/join/${invite}`);
  const t = await adminText();
  return <AuthShell title={t('signUp')}>
    <p role="status" className="m-0 rounded-xl border border-[#232733] bg-[#171a23] p-4 leading-relaxed text-[#c9cdd8]">{t('join.closed')}</p>
    <Link href="/login" className="auth-secondary self-start">{t('join.backToLogin')}</Link>
  </AuthShell>;
}
