'use client';

import { useState, useTransition } from 'react';
import type { OrderStatus } from '../../../lib/order-status';
import { changeOrderStatus, decideManualPayment, saveOrderNote } from '../actions';

type Payment = { id: string; provider: string; status: string; receiptUrl: string };
type Labels = { next: string; manualPayment: string; receipt: string; approve: string; reject: string;
  rejectConfirm: string; cancelConfirm: string; note: string; save: string; saved: string; error: string;
  mark: Partial<Record<OrderStatus, string>>; paymentStatus: Record<string, string> };

export function OrderControls({ storeId, orderId, next, note, payments, labels }: {
  storeId: string; orderId: string; next: OrderStatus[]; note: string; payments: Payment[]; labels: Labels;
}) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState('');
  const [internalNote, setInternalNote] = useState(note);
  const finish = (result: { error?: string }) => setMessage(result.error ? labels.error : labels.saved);
  return <div className="space-y-5">
    {next.length > 0 && <section className="space-y-3 rounded-xl border p-4"><h2 className="text-xl font-bold">{labels.next}</h2>
      <div className="flex flex-wrap gap-3">{next.map((status, index) => <button key={status} type="button"
        disabled={pending} className={index === 0 ? 'auth-primary' : 'auth-secondary'} onClick={() => {
          if (status === 'cancelled' && !window.confirm(labels.cancelConfirm)) return;
          start(async () => finish(await changeOrderStatus({ storeId, orderId, status })));
        }}>
        {labels.mark[status]}</button>)}</div></section>}
    {payments.filter((payment) => payment.provider === 'manual').map((payment) => <section key={payment.id} className="space-y-3 rounded-xl border p-4">
      <h2 className="text-xl font-bold">{labels.manualPayment}</h2>
      <p>{labels.paymentStatus[payment.status]}</p>
      {payment.receiptUrl && <a className="auth-secondary" href={payment.receiptUrl} target="_blank" rel="noopener noreferrer">{labels.receipt}</a>}
      {['pending', 'in_review'].includes(payment.status) && <div className="flex flex-wrap gap-3">
        <button className="auth-primary" disabled={pending} type="button" onClick={() => start(async () => finish(await decideManualPayment({ storeId, orderId, paymentId: payment.id, approve: true })))}>{labels.approve}</button>
        <button className="auth-secondary" disabled={pending} type="button" onClick={() => {
          if (window.confirm(labels.rejectConfirm)) start(async () => finish(await decideManualPayment({ storeId, orderId, paymentId: payment.id, approve: false })));
        }}>{labels.reject}</button></div>}
    </section>)}
    <form className="space-y-3 rounded-xl border p-4" onSubmit={(event) => { event.preventDefault();
      start(async () => finish(await saveOrderNote({ storeId, orderId, note: internalNote }))); }}>
      <label className="block font-bold" htmlFor="internal-note">{labels.note}</label>
      <textarea id="internal-note" className="auth-input" maxLength={2000} value={internalNote}
        onChange={(event) => setInternalNote(event.target.value)} />
      <button className="auth-primary" disabled={pending} type="submit">{labels.save}</button>
    </form>
    {message && <p role="status">{message}</p>}
  </div>;
}
