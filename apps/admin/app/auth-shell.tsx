import type { ReactNode } from 'react';
export function AuthShell({ title, children }: { title: string; children: ReactNode }) {
  return <main className="mx-auto max-w-md px-4 py-10"><h1 className="text-3xl font-semibold">{title}</h1><div className="mt-6 space-y-6">{children}</div></main>;
}
