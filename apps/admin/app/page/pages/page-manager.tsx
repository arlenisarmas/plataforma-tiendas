'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createPage, updatePageSettings } from './actions';

type Page = { id: string; title: string; slug: string; show_in_nav: boolean; nav_position: number };
type Labels = Record<'pages' | 'createPage' | 'pageName' | 'pageSlug' | 'nav' | 'savePage' |
  'saved' | 'error' | 'edit' | 'up' | 'down', string>;

export function PageManager({ storeId, initial, labels }: { storeId: string; initial: Page[]; labels: Labels }) {
  const router = useRouter();
  const [pages, setPages] = useState(initial);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [pending, start] = useTransition();
  const update = (id: string, patch: Partial<Page>) => setPages((current) => current.map((page) =>
    page.id === id ? { ...page, ...patch } : page));
  const save = (page: Page) => start(async () => {
    const result = await updatePageSettings({ storeId, pageId: page.id, title: page.title,
      showInNav: page.show_in_nav, position: page.nav_position });
    setMessage(result.error ? labels.error : labels.saved);
  });
  const swap = (index: number, next: number) => {
    if (next < 0 || next >= pages.length) return;
    const reordered = [...pages];
    [reordered[index], reordered[next]] = [reordered[next]!, reordered[index]!];
    const positioned = reordered.map((page, position) => ({ ...page, nav_position: position }));
    setPages(positioned);
    start(async () => { const results = await Promise.all(positioned.map((page) => updatePageSettings({
      storeId, pageId: page.id, title: page.title, showInNav: page.show_in_nav, position: page.nav_position })));
      setMessage(results.some((result) => result.error) ? labels.error : labels.saved); });
  };
  return <div className="space-y-5"><h1 className="text-3xl font-bold">{labels.pages}</h1>
    <form className="rounded-lg border p-4" onSubmit={(event) => { event.preventDefault(); start(async () => {
      const result = await createPage({ storeId, title });
      if (result.id) router.push(`/page/edit?store=${storeId}&page=${result.id}`);
      else setMessage(labels.error);
    }); }}>
      <label className="block">{labels.pageName}<input className="auth-input" required maxLength={120}
        value={title} onChange={(event) => setTitle(event.target.value)} /></label>
      <button disabled={pending} className="auth-primary mt-3">{labels.createPage}</button>
    </form>
    <ol className="space-y-3">{pages.map((page, index) => <li key={page.id} className="space-y-2 rounded-lg border p-4">
      <label className="block">{labels.pageName}<input className="auth-input" value={page.title}
        onChange={(event) => update(page.id, { title: event.target.value })} /></label>
      <p>{labels.pageSlug}: /{page.slug}</p>
      <label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={page.show_in_nav}
        onChange={(event) => update(page.id, { show_in_nav: event.target.checked })} />{labels.nav}</label>
      <div className="flex flex-wrap gap-2"><button type="button" className="auth-secondary" disabled={index === 0 || pending}
        onClick={() => swap(index, index - 1)}>{labels.up}</button>
        <button type="button" className="auth-secondary" disabled={index === pages.length - 1 || pending}
          onClick={() => swap(index, index + 1)}>{labels.down}</button>
        <button type="button" className="auth-secondary" disabled={pending} onClick={() => save(page)}>{labels.savePage}</button>
        <a className="auth-primary" href={`/page/edit?store=${storeId}&page=${page.id}`}>{labels.edit}</a></div>
    </li>)}</ol>
    {message && <p role="status">{message}</p>}
  </div>;
}
