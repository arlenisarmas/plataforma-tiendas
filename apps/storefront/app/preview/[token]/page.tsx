import { notFound } from 'next/navigation';
import { renderDraft } from '../../../lib/draft-preview';
import { PreviewFrame } from './preview-frame';

export const dynamic = 'force-dynamic';

export default async function PreviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const draft = await renderDraft(token);
  if (!draft) notFound();
  return <PreviewFrame token={token} origin={draft.origin} initial={draft.nodes} theme={draft.theme} storeName={draft.storeName} logoUrl={draft.logoUrl} />;
}
