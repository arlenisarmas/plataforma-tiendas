'use client';

import { useState } from 'react';

export function QuickSearch({ label, actions }: { label: string; actions: { label: string; href: string }[] }) {
  const [query, setQuery] = useState('');
  return <div className="rounded-xl border border-[#2a2f3c] p-4">
    <label className="block font-semibold" htmlFor="quick-search">{label}</label>
    <input id="quick-search" className="auth-input" value={query} onChange={(event) => setQuery(event.target.value)} />
    <ul className="mt-3 flex flex-wrap gap-2">{actions.filter((action) => action.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
      .map((action) => <li key={action.href}><a className="inline-flex min-h-11 items-center rounded-lg border border-[#2a2f3c] px-3"
        href={action.href}>{action.label}</a></li>)}</ul>
  </div>;
}
