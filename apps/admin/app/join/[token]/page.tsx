import { JoinView } from '../join-view';

export default async function JoinPage({ params, searchParams }: {
  params: Promise<{ token: string }>; searchParams: Promise<{ error?: string }>;
}) {
  const [{ token }, { error }] = await Promise.all([params, searchParams]);
  return <JoinView kind="platform" token={token} error={Boolean(error)} />;
}
