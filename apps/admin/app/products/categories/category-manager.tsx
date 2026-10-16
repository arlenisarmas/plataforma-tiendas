'use client';

import { useState, useTransition } from 'react';
import { createCategory, reorderCategories } from '../actions';

type Category = { id: string; name: string; parent_id: string | null; position: number };
export function CategoryManager({ storeId, initial, labels }: { storeId: string; initial: Category[];
  labels: { name: string; parent: string; create: string; up: string; down: string; none: string; error: string } }) {
  const [categories, setCategories] = useState(initial);
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  const move = (from: number, to: number) => {
    if (to < 0 || to >= categories.length) return;
    const next = [...categories];
    const [item] = next.splice(from, 1); if (!item) return;
    next.splice(to, 0, item); setCategories(next);
    start(async () => { const result = await reorderCategories({ storeId, ids: next.map((row) => row.id) });
      if (result.error) { setError(labels.error); setCategories(categories); } });
  };
  return <div className="space-y-5"><form className="space-y-3 rounded-xl border border-[#2a2f3c] p-4" onSubmit={(event) => {
    event.preventDefault(); start(async () => { const result = await createCategory({ storeId, name, parentId: parentId || null,
      position: categories.length }); if (result.error) setError(labels.error); else window.location.reload(); });
  }}><label className="block font-semibold">{labels.name}<input className="auth-input" required maxLength={80} value={name}
    onChange={(event) => setName(event.target.value)} /></label>
    <label className="block font-semibold">{labels.parent}<select className="auth-input" value={parentId} onChange={(event) => setParentId(event.target.value)}>
      <option value="">{labels.none}</option>{categories.filter((item) => !item.parent_id).map((item) =>
        <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    <button className="auth-primary" type="submit" disabled={pending}>{labels.create}</button></form>
    {error && <p role="alert" className="text-[#ff9aa5]">{error}</p>}
    <ul className="space-y-2">{categories.map((category, index) => <li key={category.id} draggable
      onDragStart={(event) => event.dataTransfer.setData('text/plain', String(index))}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => { event.preventDefault(); move(Number(event.dataTransfer.getData('text/plain')), index); }}
      className="flex flex-wrap items-center gap-3 rounded-lg border border-[#2a2f3c] p-3">
      <span>{category.parent_id ? '↳ ' : ''}{category.name}</span>
      <button className="auth-secondary ml-auto" type="button" disabled={pending || index === 0} onClick={() => move(index, index - 1)}>{labels.up}</button>
      <button className="auth-secondary" type="button" disabled={pending || index === categories.length - 1} onClick={() => move(index, index + 1)}>{labels.down}</button>
    </li>)}</ul>
  </div>;
}
