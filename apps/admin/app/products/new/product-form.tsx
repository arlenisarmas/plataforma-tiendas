'use client';

import { useState, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { slugify } from '@plataforma/core';
import { createProduct } from '../actions';

type Labels = Record<'name' | 'description' | 'price' | 'stock' | 'category' | 'draft' | 'active' |
  'saveDraft' | 'publish' | 'advanced' | 'slug' | 'variantName' | 'optionName' | 'optionValues' |
  'compare' | 'cost' | 'sku' | 'weight' | 'addOption' | 'saveError', string>;

export function ProductForm({ storeId, categories, labels, media }: { storeId: string;
  categories: { id: string; name: string }[]; labels: Labels; media: ReactNode }) {
  const router = useRouter();
  const [advanced, setAdvanced] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [optionName, setOptionName] = useState('');
  const [optionValues, setOptionValues] = useState('');
  const [variantPrices, setVariantPrices] = useState<Record<string, string>>({});
  const [variantStocks, setVariantStocks] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  const options = [...new Set(optionValues.split(',').map((value) => value.trim()).filter(Boolean))].slice(0, 50);
  const submit = (element: HTMLFormElement, status: 'draft' | 'active') => {
    const form = new FormData(element);
    const values = options.length && optionName.trim() ? options : [''];
    const variants = values.map((value) => ({ title: value || name,
      options: value ? { [optionName.trim()]: value } : {}, price: variantPrices[value] || price,
      compareAt: String(form.get('compare') ?? ''), cost: String(form.get('cost') ?? ''),
      sku: values.length === 1 ? String(form.get('sku') ?? '') : '',
      weightGrams: form.get('weight') ? Number(form.get('weight')) : undefined,
      stock: value ? Number(variantStocks[value] ?? stock) : Number(stock) }));
    start(async () => {
      const result = await createProduct({ storeId, name, slug, description: String(form.get('description') ?? ''),
        categoryId: String(form.get('category') ?? '') || undefined,
        assetId: String(form.get('assetId') ?? '') || undefined, status, variants }).catch(() => ({ error: 'save' }));
      if (result.error) { setError(labels.saveError); return; }
      router.push(`/products?store=${storeId}&saved=1`);
    });
  };
  return <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); submit(event.currentTarget, 'draft'); }}>
    <label className="block font-semibold">{labels.name}<input className="auth-input" required maxLength={140} value={name}
      onChange={(event) => { const next = event.target.value; setName(next); if (!slugEdited) setSlug(slugify(next)); }} /></label>
    <label className="block font-semibold">{labels.description}<textarea className="auth-input" name="description" maxLength={10000} /></label>
    <label className="block font-semibold">{labels.price}<input className="auth-input" inputMode="decimal" required value={price}
      onChange={(event) => setPrice(event.target.value)} placeholder="15.000,50" /></label>
    <label className="block font-semibold">{labels.stock}<input className="auth-input" type="number" min="0" max="1000000" required value={stock}
      onChange={(event) => setStock(event.target.value)} /></label>
    <label className="block font-semibold">{labels.category}<select className="auth-input" name="category">
      <option value="">—</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
    </select></label>
    {media}
    <label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={advanced}
      onChange={(event) => setAdvanced(event.target.checked)} />{labels.advanced}</label>
    {advanced && <div className="space-y-4 rounded-xl border border-slate-300 p-4">
      <label className="block font-semibold">{labels.slug}<input className="auth-input" value={slug}
        onChange={(event) => { setSlugEdited(true); setSlug(event.target.value.toLowerCase()); }} /></label>
      <label className="block font-semibold">{labels.compare}<input className="auth-input" name="compare" inputMode="decimal" /></label>
      <label className="block font-semibold">{labels.cost}<input className="auth-input" name="cost" inputMode="decimal" /></label>
      <label className="block font-semibold">{labels.sku}<input className="auth-input" name="sku" maxLength={64} /></label>
      <label className="block font-semibold">{labels.weight}<input className="auth-input" name="weight" type="number" min="0" /></label>
      <label className="block font-semibold">{labels.optionName}<input className="auth-input" value={optionName}
        onChange={(event) => setOptionName(event.target.value)} /></label>
      <label className="block font-semibold">{labels.optionValues}<input className="auth-input" value={optionValues}
        onChange={(event) => setOptionValues(event.target.value)} /></label>
      {options.length > 0 && optionName && <div className="space-y-3">{options.map((value) =>
        <div key={value} className="rounded-lg border border-slate-200 p-3"><strong>{value}</strong>
          <label className="block font-semibold">{labels.price}<input className="auth-input" inputMode="decimal"
            value={variantPrices[value] ?? price} onChange={(event) => setVariantPrices((current) => ({ ...current, [value]: event.target.value }))} /></label>
          <label className="block font-semibold">{labels.stock}<input className="auth-input" type="number" min="0" max="1000000"
            value={variantStocks[value] ?? stock} onChange={(event) => setVariantStocks((current) => ({ ...current, [value]: event.target.value }))} /></label></div>)}</div>}
    </div>}
    {error && <p className="text-red-700" role="alert">{error}</p>}
    <div className="flex flex-wrap gap-3"><button className="auth-secondary" type="submit" disabled={pending}>{labels.saveDraft}</button>
      <button className="auth-primary" type="button" disabled={pending} onClick={(event) => {
        const form = event.currentTarget.closest('form'); if (form?.reportValidity()) submit(form, 'active');
      }}>{labels.publish}</button></div>
  </form>;
}
