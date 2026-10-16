'use client';

import { useState, useTransition } from 'react';
import { saveCustomerNote } from '../actions';

export function CustomerNote({ storeId, customerId, initial, labels }: { storeId: string; customerId: string;
  initial: string; labels: { note: string; save: string; saved: string; error: string } }) {
  const [note, setNote] = useState(initial);
  const [status, setStatus] = useState('');
  const [pending, start] = useTransition();
  return <form className="space-y-3 rounded-xl border p-4" onSubmit={(event) => { event.preventDefault();
    start(async () => { const result = await saveCustomerNote({ storeId, customerId, note });
      setStatus(result.error ? labels.error : labels.saved); }); }}>
    <label className="block font-bold" htmlFor="customer-note">{labels.note}</label>
    <textarea id="customer-note" className="auth-input" maxLength={2000} value={note} onChange={(event) => setNote(event.target.value)} />
    <button className="auth-primary" disabled={pending} type="submit">{labels.save}</button>
    {status && <p role="status">{status}</p>}
  </form>;
}
