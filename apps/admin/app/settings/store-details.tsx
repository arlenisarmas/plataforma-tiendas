'use client';

import { useState, useTransition } from 'react';
import { saveStoreDetails } from './actions';

const keys = ['email', 'phone', 'whatsapp', 'address', 'instagram', 'facebook'] as const;
type Key = (typeof keys)[number];
type Labels = Record<Key | 'title' | 'save' | 'saved' | 'error', string>;

export function StoreDetails({ storeId, initial, labels }: { storeId: string; initial: Record<Key, string>; labels: Labels }) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState('');
  return <section className="space-y-3"><h2 className="text-2xl font-semibold">{labels.title}</h2>
    <form className="space-y-3 rounded-xl border p-4" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      start(async () => { const result = await saveStoreDetails({ storeId,
        ...Object.fromEntries(keys.map((key) => [key, form.get(key)])) });
        setMessage(result.error ? labels.error : labels.saved); });
    }}>
      {keys.map((key) => <label key={key} className="block font-semibold">{labels[key]}
        <input className="auth-input" name={key} type={key === 'email' ? 'email' : key === 'facebook' || key === 'instagram' ? 'url' : 'text'}
          defaultValue={initial[key]} maxLength={key === 'address' ? 200 : key === 'email' ? 254 : 160} /></label>)}
      <button disabled={pending} className="auth-primary min-h-11">{labels.save}</button>
      {message && <p role="status">{message}</p>}
    </form>
  </section>;
}
