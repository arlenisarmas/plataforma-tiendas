'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatMoney, type CurrencyCode } from '@plataforma/core';
import { reconcileCart, setCartQuantity } from '../../../../lib/cart-actions';

type Line = { productId: string; variantId: string; name: string; slug: string; option: string;
  quantity: number; price: bigint };
type Labels = { quantity: string; remove: string; total: string; empty: string; continueShopping: string };

export function CartLines({ storeId, storeSlug, lines, currency, locale, labels, changed }: {
  storeId: string; storeSlug: string; lines: Line[]; currency: CurrencyCode; locale: string; labels: Labels; changed: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string>();
  useEffect(() => { if (changed) void reconcileCart(storeId); }, [changed, storeId]);
  const update = async (variantId: string, quantity: number) => {
    setPending(variantId);
    try { await setCartQuantity({ storeId, variantId, quantity }); router.refresh(); }
    finally { setPending(undefined); }
  };
  if (!lines.length) return <p>{labels.empty} <Link href={`/?tienda=${storeSlug}`} className="underline">{labels.continueShopping}</Link></p>;
  const total = lines.reduce((sum, line) => sum + line.price * BigInt(line.quantity), 0n);
  return <><ul className="divide-y rounded-xl border">{lines.map((line) => <li key={line.variantId}
    className="flex flex-wrap items-center justify-between gap-4 p-4">
    <div><Link href={`/producto/${line.slug}?tienda=${storeSlug}`} className="font-semibold underline">{line.name}</Link>
      <p className="text-sm">{line.option}</p><p>{formatMoney({ amount: line.price, currency }, locale)}</p></div>
    <div className="flex items-center gap-2"><label htmlFor={`qty-${line.variantId}`}>{labels.quantity}</label>
      <select id={`qty-${line.variantId}`} value={line.quantity} disabled={pending === line.variantId}
        onChange={(event) => void update(line.variantId, Number(event.target.value))}
        className="min-h-11 rounded border p-2">{Array.from({ length: 99 }, (_, index) => index + 1)
          .map((quantity) => <option key={quantity} value={quantity}>{quantity}</option>)}</select>
      <button type="button" onClick={() => void update(line.variantId, 0)} disabled={pending === line.variantId}
        className="min-h-11 rounded px-2 underline">{labels.remove}</button></div>
  </li>)}</ul><p className="mt-6 text-xl font-semibold">{labels.total}: {formatMoney({ amount: total, currency }, locale)}</p></>;
}
