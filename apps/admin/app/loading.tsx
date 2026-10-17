import { adminText } from '../lib/locale';

export default async function Loading() {
  const t = await adminText();
  return <main className="mx-auto max-w-3xl space-y-5 p-6" aria-busy="true">
    <h1 className="text-2xl font-bold">{t('loading')}</h1>
    <div className="h-12 animate-pulse rounded-lg bg-[#262a36]" />
    <div className="h-32 animate-pulse rounded-lg bg-[#262a36]" />
    <div className="h-32 animate-pulse rounded-lg bg-[#262a36]" />
  </main>;
}
