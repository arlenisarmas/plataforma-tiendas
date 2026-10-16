'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { adjustProductStock } from '../actions';

export function StockControl({ storeId, variantId, onHand, labels }: { storeId: string; variantId: string; onHand: number;
  labels: { add: string; correct: string; delta: string; note: string; error: string } }) {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  const save = (mode: 'add' | 'correct') => start(async () => {
    const value = Number(amount);
    const delta = mode === 'add' ? value : value - onHand;
    const result = await adjustProductStock({ storeId, variantId, delta, note }).catch(() => ({ error: 'save' }));
    if (result.error) setError(labels.error);
    else { setAmount(''); setError(''); router.refresh(); }
  });
  return <div className="space-y-3"><label className="block font-semibold">{labels.delta}<input className="auth-input" type="number" min="0"
    value={amount} onChange={(event) => setAmount(event.target.value)} /></label>
    <label className="block font-semibold">{labels.note}<input className="auth-input" maxLength={300} value={note}
      onChange={(event) => setNote(event.target.value)} /></label>
    <div className="flex flex-wrap gap-3"><button type="button" className="auth-primary" disabled={pending || !amount || Number(amount) <= 0}
      onClick={() => save('add')}>{labels.add}</button>
      <button type="button" className="auth-secondary" disabled={pending || !amount || Number(amount) === onHand}
        onClick={() => save('correct')}>{labels.correct}</button></div>
    {error && <p role="alert" className="text-red-700">{error}</p>}
  </div>;
}
