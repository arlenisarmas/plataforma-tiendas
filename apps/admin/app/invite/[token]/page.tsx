import { JoinView } from '../../join/join-view';

export default async function InvitationPage({ params, searchParams }: {
  params: Promise<{ token: string }>; searchParams: Promise<{ error?: string }>;
}) {
  const [{ token }, { error }] = await Promise.all([params, searchParams]);
  return <JoinView kind="store" token={token} error={Boolean(error)} />;
}
