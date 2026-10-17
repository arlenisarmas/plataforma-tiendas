'use client';

import { useState, useTransition } from 'react';
import { savePayment, saveShipping } from './actions';

type Labels = Record<'shipping' | 'payment' | 'pickup' | 'flatRate' | 'name' | 'description' | 'price' |
  'freeOver' | 'save' | 'saved' | 'error' | 'method' | 'transfer' | 'mobile' | 'zelle' | 'cash' |
  'holder' | 'bank' | 'account' | 'phone' | 'email' | 'note' | 'mercadoPago' | 'comingSoon' | 'configured', string>;
type Shipping = { id: string; name: string; kind: 'pickup' | 'flat_rate'; description: string | null;
  price: string; freeOver: string };
type Method = 'transferencia' | 'pago-movil' | 'zelle' | 'efectivo';

function ShippingForm({ storeId, labels, initial }: { storeId: string; labels: Labels; initial?: Shipping }) {
  const [kind, setKind] = useState<'pickup' | 'flat_rate'>(initial?.kind ?? 'pickup');
  const [message, setMessage] = useState('');
  const [pending, start] = useTransition();
  return <form className="space-y-3 rounded-xl border p-4" onSubmit={(event) => {
    event.preventDefault(); setMessage(''); const data = new FormData(event.currentTarget);
    start(async () => { const result = await saveShipping({ storeId, id: initial?.id, kind,
      name: data.get('name'), description: data.get('description'), price: data.get('price') ?? '',
      freeOver: data.get('freeOver') ?? '', active: true });
      setMessage(result.error ? labels.error : labels.saved); });
  }}>
    <label className="block font-semibold">{labels.shipping}<select className="auth-input" value={kind}
      onChange={(event) => setKind(event.target.value as 'pickup' | 'flat_rate')}>
      <option value="pickup">{labels.pickup}</option><option value="flat_rate">{labels.flatRate}</option></select></label>
    <label className="block font-semibold">{labels.name}<input className="auth-input" name="name" required maxLength={80}
      defaultValue={initial?.name ?? (kind === 'pickup' ? labels.pickup : labels.flatRate)} /></label>
    <label className="block font-semibold">{labels.description}<input className="auth-input" name="description" maxLength={300}
      defaultValue={initial?.description ?? ''} /></label>
    {kind === 'flat_rate' && <><label className="block font-semibold">{labels.price}<input className="auth-input"
      name="price" inputMode="decimal" required defaultValue={initial?.price ?? ''} /></label>
      <label className="block font-semibold">{labels.freeOver}<input className="auth-input" name="freeOver"
        inputMode="decimal" defaultValue={initial?.freeOver ?? ''} /></label></>}
    <button disabled={pending} className="auth-primary min-h-11">{labels.save}</button>
    {message && <p role="status">{message}</p>}
  </form>;
}

function PaymentForm({ storeId, labels }: { storeId: string; labels: Labels }) {
  const [method, setMethod] = useState<Method>('transferencia');
  const [message, setMessage] = useState('');
  const [pending, start] = useTransition();
  const options: [Method, string][] = [['transferencia', labels.transfer], ['pago-movil', labels.mobile],
    ['zelle', labels.zelle], ['efectivo', labels.cash]];
  const fields = method === 'transferencia' ? ['holder', 'bank', 'account'] : method === 'pago-movil' ?
    ['holder', 'bank', 'phone'] : method === 'zelle' ? ['holder', 'email'] : ['note'];
  return <form className="space-y-3 rounded-xl border p-4" onSubmit={(event) => {
    event.preventDefault(); setMessage(''); const form = new FormData(event.currentTarget);
    start(async () => { const result = await savePayment({ storeId, method,
      displayName: options.find(([key]) => key === method)?.[1],
      fields: Object.fromEntries(fields.map((key) => [key, form.get(key)])) });
      setMessage(result.error ? labels.error : labels.saved); });
  }}>
    <label className="block font-semibold">{labels.method}<select className="auth-input" value={method}
      onChange={(event) => { setMethod(event.target.value as Method); setMessage(''); }}>
      {options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    {fields.map((key) => <label key={key} className="block font-semibold">{labels[key as keyof Labels]}
      <input className="auth-input" name={key} type={key === 'email' ? 'email' : 'text'} required maxLength={160} /></label>)}
    <button disabled={pending} className="auth-primary min-h-11">{labels.save}</button>
    {message && <p role="status">{message}</p>}
  </form>;
}

export function SettingsForms({ storeId, labels, shipping, methods, mercadoPagoConnected }: { storeId: string; labels: Labels;
  shipping: Shipping[]; methods: Method[]; mercadoPagoConnected: boolean }) {
  return <div className="space-y-8"><section className="space-y-3"><h2 className="text-2xl font-semibold">{labels.shipping}</h2>
    {shipping.map((item) => <ShippingForm key={item.id} storeId={storeId} labels={labels} initial={item} />)}
    <ShippingForm key={`new-${shipping.length}`} storeId={storeId} labels={labels} />
  </section><section className="space-y-3"><h2 className="text-2xl font-semibold">{labels.payment}</h2>
    {methods.map((method) => <p key={method} className="rounded border p-3">{optionsName(method, labels)} — {labels.configured}</p>)}
    <PaymentForm storeId={storeId} labels={labels} />
    <div className="rounded-xl border p-4">{mercadoPagoConnected ? <p>{labels.mercadoPago} — {labels.configured}</p> :
      <a className="inline-flex min-h-11 items-center rounded border px-4" href={`/api/payments/mercadopago?store=${storeId}`}>
        {labels.mercadoPago}</a>}</div>
  </section></div>;
}

function optionsName(method: Method, labels: Labels) {
  return { transferencia: labels.transfer, 'pago-movil': labels.mobile, zelle: labels.zelle, efectivo: labels.cash }[method];
}
