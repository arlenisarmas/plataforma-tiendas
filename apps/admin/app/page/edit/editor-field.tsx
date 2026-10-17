'use client';

import type { FieldSpec } from '@plataforma/blocks';
import { MediaPicker } from '../../media-picker';

type Asset = { id: string; path: string; alt_text: string | null; size_bytes: number };
type Choice = { id: string; name: string };

export function EditorField({ field, value, change, storeId, assets, products, categories, text, mediaText, addItem, removeItem }: {
  field: FieldSpec; value: unknown; change: (value: unknown) => void; storeId: string;
  assets: Asset[]; products: Choice[]; categories: Choice[]; text: Record<string, string>;
  mediaText: { choose: string; upload: string; camera: string; alt: string; suggestion: string;
    invalid: string; failed: string; selected: string; empty: string }; addItem: string; removeItem: string;
}) {
  const label = text[field.i18n.label.replace(/^blocks\./, '')] ?? field.name;
  const stringValue = typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  const shared = { className: 'auth-input', 'aria-label': label };
  if (field.kind === 'list') {
    const items = Array.isArray(value) ? value as Record<string, unknown>[] : [];
    return <fieldset className="space-y-3 rounded-lg border p-3"><legend className="font-semibold">{label}</legend>
      {items.map((item, index) => <div key={index} className="space-y-2 rounded border p-3">
        {(field.itemFields ?? []).map((child) => <EditorField key={child.name} field={child} value={item[child.name]}
          change={(next) => change(items.map((entry, at) => at === index ? { ...entry, [child.name]: next } : entry))}
          storeId={storeId} assets={assets} products={products} categories={categories} text={text} mediaText={mediaText}
          addItem={addItem} removeItem={removeItem} />)}
        <button type="button" className="auth-secondary" onClick={() => change(items.filter((_, at) => at !== index))}>{removeItem}</button>
      </div>)}
      <button type="button" className="auth-secondary" disabled={items.length >= (field.maxItems ?? 40)}
        onClick={() => change([...items, Object.fromEntries((field.itemFields ?? []).map((child) => [child.name, '']))])}>{addItem}</button>
    </fieldset>;
  }
  if (field.kind === 'image') {
    const current = typeof value === 'string' ? value : value && typeof value === 'object' && 'assetId' in value ?
      String(value.assetId) : undefined;
    return <div><p className="font-semibold">{label}</p><MediaPicker storeId={storeId} folder="blocks" initial={assets}
      labels={mediaText} current={current} onSelect={(asset) => change(field.name === 'assetId' ? asset.id :
        { assetId: asset.id, alt: asset.alt_text || asset.path.split('/').at(-1) || label })} /></div>;
  }
  if (field.kind === 'toggle') return <label className="flex min-h-11 items-center gap-2"><input type="checkbox"
    checked={value === true} onChange={(event) => change(event.target.checked)} />{label}</label>;
  if (field.kind === 'textarea') return <label className="block font-semibold">{label}<textarea {...shared}
    value={stringValue} onChange={(event) => change(event.target.value)} rows={3} /></label>;
  if (field.kind === 'select' || field.kind === 'product-picker' || field.kind === 'category-picker' || field.kind === 'color-token') {
    const options = field.kind === 'product-picker' ? products.map((item) => ({ value: item.id, label: item.name })) :
      field.kind === 'category-picker' ? categories.map((item) => ({ value: item.id, label: item.name })) :
        field.kind === 'color-token' ? ['primary', 'accent', 'background', 'surface', 'text'].map((token) => ({ value: token, label: token })) :
          (field.options ?? []).map((item) => ({ value: item.value, label: text[item.i18nLabel.replace(/^blocks\./, '')] ?? item.value }));
    return <label className="block font-semibold">{label}<select {...shared} value={stringValue}
      onChange={(event) => change(event.target.value)}><option value="">—</option>
      {options.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>;
  }
  return <label className="block font-semibold">{label}<input {...shared}
    type={field.kind === 'number' ? 'number' : field.kind === 'link' ? 'url' : 'text'}
    value={stringValue} onChange={(event) => change(field.kind === 'number' ? Number(event.target.value) : event.target.value)} /></label>;
}
