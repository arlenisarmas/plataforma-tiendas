import { z } from 'zod';
import { notFound } from 'next/navigation';
import { adminText } from '../../../lib/locale';
import { AuthShell } from '../../auth-shell';
import { InvitationAcceptance } from './invitation-acceptance';

export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!z.string().min(32).max(100).safeParse(token).success) notFound();
  const t = await adminText();
  return <AuthShell title={t('customersPanel.teamInvitation')} intro={t('customersPanel.invitationHelp')}>
    <InvitationAcceptance token={token} labels={{ accept: t('customersPanel.accept'), error: t('customersPanel.invitationError') }} />
  </AuthShell>;
}
