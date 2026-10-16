'use client';

import { useSyncExternalStore } from 'react';
import { isLocale, messages, type Locale } from '@plataforma/i18n';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const locale = useSyncExternalStore(() => () => {}, () => {
    const candidate = document.body.dataset.locale;
    return candidate && isLocale(candidate) ? candidate : 'es-419';
  }, (): Locale => 'es-419');
  return <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center gap-5 p-6 text-center">
    <h1 className="text-2xl font-bold">{messages[locale].admin.loadError}</h1>
    <button className="auth-primary" type="button" onClick={reset}>{messages[locale].admin.retry}</button>
  </main>;
}
