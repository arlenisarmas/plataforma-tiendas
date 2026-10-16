import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { adminLocale } from '../lib/locale';
import './globals.css';

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await adminLocale();
  const candidate = Number((await cookies()).get('text-scale')?.value ?? 100);
  const scale = Number.isInteger(candidate) && candidate >= 100 && candidate <= 150 ? candidate : 100;
  return (
    <html lang={locale} style={{ fontSize: `${scale}%` }}>
      <body data-locale={locale} className="bg-white text-base text-slate-900">{children}</body>
    </html>
  );
}
