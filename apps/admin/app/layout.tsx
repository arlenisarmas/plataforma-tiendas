import type { ReactNode } from 'react';
import './globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-419">
      <body className="bg-white text-base text-slate-900">{children}</body>
    </html>
  );
}
