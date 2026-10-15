import { getTranslations } from 'next-intl/server';

export default async function HomePage() {
  const t = await getTranslations('admin');
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold">{t('title')}</h1>
      <p className="mt-4">{t('description')}</p>
    </main>
  );
}
