'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatMoney, type CurrencyCode } from '@plataforma/core';
import { addCartItem } from '../../../../../lib/cart-actions';

type Variant = { id: string; title: string; price_amount: number; is_available: boolean; is_default: boolean };
type Labels = { options: string; outOfStock: string; add: string; added: string; share: string; addError: string };

export function VariantPicker({ variants, currency, locale, storeId, productId, labels }: {
  variants: Variant[]; currency: CurrencyCode; locale: string; storeId: string; productId: string; labels: Labels;
}) {
  const [live, setLive] = useState(variants);
  const router = useRouter();
  const [selected, setSelected] = useState(variants.find((item) => item.is_default && item.is_available)?.id ??
    variants.find((item) => item.is_available)?.id ?? '');
  const [added, setAdded] = useState(false);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);
  const variant = live.find((item) => item.id === selected);
  const refresh = async () => {
    const response = await fetch(`/api/stock?storeId=${storeId}&productId=${productId}`, { cache: 'no-store' });
    if (!response.ok) return false;
    const availability: unknown = await response.json();
    if (!Array.isArray(availability)) return false;
    const current = live.map((item) => ({ ...item, is_available: availability.some((entry: unknown) =>
      typeof entry === 'object' && entry !== null && 'id' in entry && entry.id === item.id &&
      'is_available' in entry && entry.is_available === true) }));
    setLive(current);
    return current.find((item) => item.id === selected)?.is_available ?? false;
  };
  useEffect(() => { const timer = setInterval(() => { void refresh(); }, 15000);
    return () => clearInterval(timer); });
  const add = async () => {
    if (!variant?.is_available || !(await refresh())) return;
    setError(false);
    setPending(true);
    try {
      const result = await addCartItem({ storeId, productId, variantId: variant.id });
      if (!result.error) { router.refresh(); setAdded(true); }
      else setError(true);
    } finally { setPending(false); }
  };
  return <div className="space-y-4">
    <fieldset><legend className="font-semibold">{labels.options}</legend>
      <div className="mt-2 grid gap-2">{live.map((item) => <label key={item.id}
        className={`flex min-h-11 items-center gap-2 rounded border p-3 ${item.is_available ? '' : 'opacity-60'}`}>
        <input type="radio" name="variant" value={item.id} checked={selected === item.id} disabled={!item.is_available}
          onChange={() => { setSelected(item.id); setAdded(false); setError(false); }} />
        <span>{item.title} — {item.is_available ? formatMoney({ amount: BigInt(item.price_amount), currency }, locale) : labels.outOfStock}</span>
      </label>)}</div>
    </fieldset>
    <button type="button" disabled={!variant?.is_available || pending} onClick={add}
      className="min-h-11 rounded bg-slate-900 px-6 text-white disabled:opacity-50">{added ? labels.added : labels.add}</button>
    {error && <p role="alert">{labels.addError}</p>}
    <button type="button" className="block min-h-11 py-3 underline" onClick={() =>
      window.open(`https://wa.me/?text=${encodeURIComponent(window.location.href)}`, '_blank', 'noopener,noreferrer')}>
      {labels.share}</button>
  </div>;
}
