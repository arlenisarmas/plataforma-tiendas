'use client';

import { useId, useState, useTransition } from 'react';
import { compressImage } from '../lib/compress-image';
import { uploadMedia } from './media-actions';

type Asset = { id: string; path: string; alt_text: string | null; size_bytes: number };
type Labels = { choose: string; upload: string; camera: string; alt: string; suggestion: string;
  invalid: string; failed: string; selected: string; empty: string };

export function MediaPicker({ storeId, folder, initial, labels, name = 'assetId', current, onSelect }: {
  storeId: string; folder: 'library' | 'products' | 'blocks' | 'logos'; initial: Asset[];
  labels: Labels; name?: string; current?: string | undefined; onSelect?: (asset: Asset) => void;
}) {
  const fileId = useId();
  const altId = useId();
  const [assets, setAssets] = useState(initial);
  const [selected, setSelected] = useState<string | undefined>(current);
  const [file, setFile] = useState<File>();
  const [alt, setAlt] = useState('');
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '') ?? '';
  const choose = (asset: Asset) => { setSelected(asset.id); onSelect?.(asset); };
  const submit = () => start(async () => {
    if (!file) { setError(labels.invalid); return; }
    try {
      const compressed = await compressImage(file);
      const form = new FormData();
      form.set('storeId', storeId); form.set('folder', folder); form.set('alt', alt); form.set('file', compressed);
      const result = await uploadMedia(form);
      if (!result.asset) { setError(result.error === 'format' ? labels.invalid : labels.failed); return; }
      setAssets((current) => [result.asset, ...current]);
      choose(result.asset); setFile(undefined); setError('');
    } catch { setError(labels.invalid); }
  });
  return <div className="space-y-4">
    <div className="rounded-xl border border-[#2a2f3c] p-4">
      <label className="block font-semibold" htmlFor={fileId}>{labels.upload}</label>
      <input id={fileId} className="auth-input" type="file" accept="image/*"
        onChange={(event) => { const next = event.target.files?.[0]; setFile(next); setAlt(next?.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ') ?? ''); setError(''); }} />
      <p className="mt-1 text-sm">{labels.camera}</p>
      <label className="mt-3 block font-semibold" htmlFor={altId}>{labels.alt}</label>
      <input id={altId} className="auth-input" value={alt} maxLength={300} placeholder={labels.suggestion}
        onChange={(event) => setAlt(event.target.value)} />
      <button className="auth-primary mt-4" type="button" disabled={pending} onClick={submit}>{labels.upload}</button>
      {error && <p className="mt-2 text-[#ff9aa5]" role="alert">{error}</p>}
    </div>
    <div aria-label={labels.choose} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {assets.length === 0 && <p>{labels.empty}</p>}
      {assets.map((asset) => <button key={asset.id} type="button" aria-label={`${labels.choose}: ${asset.alt_text ?? asset.path}`}
        aria-pressed={selected === asset.id} onClick={() => choose(asset)}
        className="min-h-24 overflow-hidden rounded-lg border-2 border-[#2a2f3c] aria-pressed:border-[#8c90ff]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt={asset.alt_text ?? ''} className="aspect-square w-full object-cover" loading="lazy"
          src={`${base}/storage/v1/object/public/store-media/${asset.path.split('/').map(encodeURIComponent).join('/')}`} />
        <span>{Math.ceil(asset.size_bytes / 1024)} KB</span>
      </button>)}
    </div>
    <input type="hidden" name={name} value={selected ?? ''} />
    {selected && <p role="status">{labels.selected}</p>}
  </div>;
}
