import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export default async function NotFoundPage() {
  const t = await getTranslations('storefront');
  return <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 px-6 text-center">
    <h1 className="text-2xl font-semibold">404</h1>
    <p>{t('unavailable')}</p>
    <Link className="rounded bg-slate-900 px-6 py-3 text-white" href="/">{t('title')}</Link>
  </main>;
}
