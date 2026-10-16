import { z } from 'zod';
import { notFound } from 'next/navigation';
import { adminText } from '../../../lib/locale';
import { InvitationAcceptance } from './invitation-acceptance';

export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!z.string().min(32).max(100).safeParse(token).success) notFound();
  const t = await adminText();
  return <main className="mx-auto max-w-xl space-y-5 p-6">
    <h1 className="text-3xl font-bold">{t('customersPanel.teamInvitation')}</h1>
    <p>{t('customersPanel.invitationHelp')}</p>
    <InvitationAcceptance token={token} labels={{ accept: t('customersPanel.accept'), error: t('customersPanel.invitationError') }} />
  </main>;
}
