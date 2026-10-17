'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createLegalDrafts } from './actions';
import { legalSlugs, type LegalSlug } from '../../lib/legal-drafts';

type Labels = Record<'title' | 'intro' | 'notice' | 'create' | 'ready' | 'saved' | 'error' | 'unsupported' | 'edit', string>
  & Record<LegalSlug, { title: string }>;
type Page = { id: string; slug: string };

export function LegalDrafts({ storeId, pages, labels }: { storeId: string; pages: Page[]; labels: Labels }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState('');
  const existing = new Map(pages.map((page) => [page.slug, page.id]));
  return <section className="space-y-3"><h2 className="text-2xl font-semibold">{labels.title}</h2>
    <p>{labels.intro}</p>
    <p className="rounded border border-[#f5c77a] bg-[#3d3115] p-3 text-[#e9ebf2]">{labels.notice}</p>
    <ul className="space-y-2">{legalSlugs.map((slug) => <li key={slug} className="flex flex-wrap items-center justify-between gap-3 rounded border p-3">
      <span>{labels[slug].title}</span>
      {existing.has(slug) ? <a className="auth-secondary min-h-11" href={`/page/edit?store=${storeId}&page=${existing.get(slug)}`}>{labels.edit}</a>
        : <span>{labels.ready}</span>}
    </li>)}</ul>
    {pages.length < legalSlugs.length && <button type="button" disabled={pending} className="auth-primary min-h-11"
      onClick={() => start(async () => { const result = await createLegalDrafts({ storeId });
        setMessage(result.error === 'unsupported' ? labels.unsupported : result.error ? labels.error : labels.saved);
        if (!result.error) router.refresh();
      })}>{labels.create}</button>}
    {message && <p role="status">{message}</p>}
  </section>;
}
