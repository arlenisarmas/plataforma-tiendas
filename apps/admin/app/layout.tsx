import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { messages } from '@plataforma/i18n';
import { adminLocale } from '../lib/locale';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const title = messages[await adminLocale()].admin.metaTitle;
  return { title: { default: title, template: `%s · ${title}` } };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await adminLocale();
  const candidate = Number((await cookies()).get('text-scale')?.value ?? 100);
  const scale = Number.isInteger(candidate) && candidate >= 100 && candidate <= 150 ? candidate : 100;
  return (
    <html lang={locale} style={{ fontSize: `${scale}%` }}>
      <body data-locale={locale} className="bg-[#0e1016] text-base text-[#e9ebf2]">{children}</body>
    </html>
  );
}
