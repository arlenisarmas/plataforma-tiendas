'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatMoney, type CurrencyCode } from '@plataforma/core';
import { placeOrder } from '../../../../lib/checkout-actions';

type Labels = Record<'title' | 'contact' | 'delivery' | 'payment' | 'confirm' | 'email' | 'name' |
  'phone' | 'address' | 'city' | 'postal' | 'next' | 'back' | 'place' | 'total' | 'empty' |
  'error' | 'stock' | 'rate' | 'unavailable' | 'adjust', string>;
type Shipping = { id: string; name: string; kind: 'pickup' | 'flat_rate' | 'local_delivery';
  price_amount: number; free_over_amount: number | null };
type Payment = { id: string; provider: 'manual' | 'mercadopago'; display_name: string };

export function CheckoutSteps({ storeId, storeSlug, currency, locale, total, shipping, payments, labels }: {
  storeId: string; storeSlug: string; currency: CurrencyCode; locale: string; total: bigint;
  shipping: Shipping[]; payments: Payment[]; labels: Labels;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pending, start] = useTransition();
  const [error, setError] = useState('');
  const [stockError, setStockError] = useState(false);
  const [contact, setContact] = useState({ fullName: '', email: '', phone: '' });
  const [address, setAddress] = useState({ line1: '', city: '', postalCode: '' });
  const [shippingId, setShippingId] = useState(shipping[0]?.id ?? '');
  const [paymentId, setPaymentId] = useState(payments[0]?.id ?? '');
  const selectedShipping = shipping.find((item) => item.id === shippingId);
  const selectedPayment = payments.find((item) => item.id === paymentId);
  const shippingAmount = selectedShipping && (!selectedShipping.free_over_amount ||
    total < BigInt(selectedShipping.free_over_amount)) ? BigInt(selectedShipping.price_amount) : 0n;
  const submit = () => {
    setError(''); setStockError(false);
    start(async () => {
      const result = await placeOrder({ storeId, ...contact, shippingMethodId: shippingId,
        paymentMethodId: paymentId, ...(selectedShipping?.kind === 'pickup' ? {} : { address }) });
      if (result.ok) {
        if (result.checkout.kind === 'redirect') window.location.assign(result.checkout.url);
        else router.push(`/pedido/${result.orderId}?token=${encodeURIComponent(result.token)}&tienda=${storeSlug}`);
        return;
      }
      setStockError(result.error === 'stock');
      setError(result.error === 'stock' ? labels.stock.replace('{product}', result.product ?? '') :
        result.error === 'rate' ? labels.rate : result.error === 'unavailable' ? labels.unavailable : labels.error);
    });
  };
  if (!shipping.length || !payments.length) return <p role="status">{labels.unavailable}</p>;
  const steps = [labels.contact, labels.delivery, labels.payment, labels.confirm];
  const inputClass = 'mt-1 block min-h-11 w-full rounded border px-3 text-base';
  return <div className="space-y-5">
    <ol aria-label={labels.title} className="flex flex-wrap gap-2 text-sm">{steps.map((name, index) =>
      <li key={name} aria-current={step === index ? 'step' : undefined}
        className={`rounded-full border px-3 py-2 ${step === index ? 'font-bold' : ''}`}>{index + 1}. {name}</li>)}</ol>
    <p className="text-lg font-semibold">{labels.total}: {formatMoney({ amount: total + shippingAmount, currency }, locale)}</p>
    {step === 0 && <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); setStep(1); }}>
      <h2 className="text-2xl font-semibold">{labels.contact}</h2>
      <label className="block">{labels.name}<input className={inputClass} autoComplete="name" required maxLength={120}
        value={contact.fullName} onChange={(event) => setContact({ ...contact, fullName: event.target.value })} /></label>
      <label className="block">{labels.email}<input className={inputClass} type="email" autoComplete="email" required
        value={contact.email} onChange={(event) => setContact({ ...contact, email: event.target.value })} /></label>
      <label className="block">{labels.phone}<input className={inputClass} type="tel" autoComplete="tel" maxLength={40}
        value={contact.phone} onChange={(event) => setContact({ ...contact, phone: event.target.value })} /></label>
      <button className="min-h-11 w-full rounded bg-black px-4 text-white">{labels.next}</button>
    </form>}
    {step === 1 && <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); setStep(2); }}>
      <h2 className="text-2xl font-semibold">{labels.delivery}</h2>
      <fieldset className="space-y-2"><legend className="sr-only">{labels.delivery}</legend>{shipping.map((item) =>
        <label key={item.id} className="flex min-h-11 items-center gap-3 rounded border p-3">
          <input type="radio" name="shipping" checked={shippingId === item.id} onChange={() => setShippingId(item.id)} />
          {item.name}</label>)}</fieldset>
      {selectedShipping?.kind !== 'pickup' && <>
        <label className="block">{labels.address}<input className={inputClass} autoComplete="street-address" required
          value={address.line1} onChange={(event) => setAddress({ ...address, line1: event.target.value })} /></label>
        <label className="block">{labels.city}<input className={inputClass} autoComplete="address-level2" required
          value={address.city} onChange={(event) => setAddress({ ...address, city: event.target.value })} /></label>
        <label className="block">{labels.postal}<input className={inputClass} autoComplete="postal-code"
          value={address.postalCode} onChange={(event) => setAddress({ ...address, postalCode: event.target.value })} /></label>
      </>}
      <button className="min-h-11 w-full rounded bg-black px-4 text-white">{labels.next}</button>
    </form>}
    {step === 2 && <div className="space-y-4"><h2 className="text-2xl font-semibold">{labels.payment}</h2>
      <fieldset className="space-y-2"><legend className="sr-only">{labels.payment}</legend>{payments.map((item) =>
        <label key={item.id} className="flex min-h-11 items-center gap-3 rounded border p-3">
          <input type="radio" name="payment" checked={paymentId === item.id} onChange={() => setPaymentId(item.id)} />
          {item.display_name}</label>)}</fieldset>
      <button disabled={!selectedPayment} onClick={() => setStep(3)} className="min-h-11 w-full rounded bg-black px-4 text-white">
        {labels.next}</button></div>}
    {step === 3 && <div className="space-y-4"><h2 className="text-2xl font-semibold">{labels.confirm}</h2>
      <p>{contact.fullName} · {contact.email}</p><p>{selectedShipping?.name} · {selectedPayment?.display_name}</p>
      <button disabled={pending} onClick={submit} className="min-h-11 w-full rounded bg-black px-4 text-white">
        {labels.place}</button></div>}
    {error && <div role="alert" className="rounded border border-red-600 p-3">{error}
      {stockError && <Link className="block min-h-11 underline"
        href={`/carrito?tienda=${storeSlug}`}>{labels.adjust}</Link>}</div>}
    {step > 0 && <button type="button" className="min-h-11 underline" onClick={() => { setError(''); setStep(step - 1); }}>
      {labels.back}</button>}
  </div>;
}
