'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { MediaPicker } from '../media-picker';
import { saveCover } from './actions';
import { sendPreviewChange } from './build-preview';

type Variant = 'split' | 'background' | 'minimal';
type Labels = { title: string; subtitle: string; design: string; photo: string; save: string; saved: string; error: string;
  variants: Record<Variant, string> };

function Sketch({ variant }: { variant: Variant }) {
  return <svg viewBox="0 0 120 72" className="h-auto w-full rounded-lg" aria-hidden="true">
    <rect width="120" height="72" fill="#f3eefa" />
    {variant === 'background' && <rect width="120" height="72" fill="#8f86b8" />}
    {variant === 'split' && <rect x="64" y="8" width="48" height="56" rx="4" fill="#8f86b8" />}
    <rect x={variant === 'minimal' ? 30 : 10} y="22" width={variant === 'minimal' ? 60 : 44} height="7" rx="2" fill={variant === 'background' ? '#ffffff' : '#2a2320'} />
    <rect x={variant === 'minimal' ? 38 : 10} y="34" width={variant === 'minimal' ? 44 : 34} height="4" rx="2" fill={variant === 'background' ? '#ffffff' : '#6a6070'} />
    <rect x={variant === 'minimal' ? 46 : 10} y="46" width="28" height="9" rx="4.5" fill="#6a4c9c" />
  </svg>;
}

type Asset = { id: string; path: string; alt_text: string | null; size_bytes: number };
type MediaLabels = Parameters<typeof MediaPicker>[0]['labels'];

export function CoverStep({ storeId, initial, labels, assets, mediaLabels, onSavedHref, blocks }: {
  storeId: string; initial: { title: string; subtitle: string; variant: Variant; assetId: string | null }; blocks: unknown[];
  labels: Labels; assets: Asset[]; mediaLabels: MediaLabels; onSavedHref: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [subtitle, setSubtitle] = useState(initial.subtitle);
  const [variant, setVariant] = useState<Variant>(initial.variant);
  const [asset, setAsset] = useState<{ id: string; alt: string } | null>(initial.assetId ? { id: initial.assetId, alt: '' } : null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  // Vista previa en vivo: se reemplaza la portada del borrador con lo que se va escribiendo.
  const preview = (change: { title?: string; subtitle?: string; variant?: Variant; assetId?: string | null }) => {
    const next = { title, subtitle, variant, assetId: asset?.id ?? null, ...change };
    const index = blocks.findIndex((block) => typeof block === 'object' && block !== null && (block as { type?: unknown }).type === 'hero');
    const previous = index >= 0 ? blocks[index] as { props?: Record<string, unknown> } : null;
    const hero = { ...(previous ?? { id: 'preview-hero', type: 'hero', version: 1 }), variant: next.variant,
      props: { ...(previous?.props ?? {}), title: next.title || ' ', subtitle: next.subtitle || undefined,
        ...(next.assetId ? { image: { assetId: next.assetId, alt: next.title } } : {}) } };
    sendPreviewChange({ blocks: index >= 0 ? blocks.map((block, at) => at === index ? hero : block) : [hero, ...blocks] });
  };
  const save = () => start(async () => {
    const result = await saveCover({ storeId, title, subtitle, variant, ...(asset ? { assetId: asset.id, alt: asset.alt || title } : {}) });
    setMessage(result.error ? { ok: false, text: labels.error } : { ok: true, text: labels.saved });
    if (!result.error) router.push(onSavedHref);
  });
  return <div className="flex flex-col gap-5">
    <label className="block font-semibold">{labels.title}
      <input className="auth-input font-normal" value={title} maxLength={120} onChange={(event) => { setTitle(event.target.value); preview({ title: event.target.value }); }} /></label>
    <label className="block font-semibold">{labels.subtitle}
      <input className="auth-input font-normal" value={subtitle} maxLength={240} onChange={(event) => { setSubtitle(event.target.value); preview({ subtitle: event.target.value }); }} /></label>
    <fieldset className="m-0 border-0 p-0">
      <legend className="mb-3 font-semibold">{labels.design}</legend>
      <div className="grid grid-cols-3 gap-3">{(['split', 'background', 'minimal'] as const).map((item) =>
        <label key={item} className="flex cursor-pointer flex-col gap-2 rounded-xl border-2 border-[#2a2f3c] bg-[#0e1016] p-2.5 has-[:checked]:border-[#8c90ff] has-[:checked]:bg-[#232850]">
          <input type="radio" name="variant" value={item} checked={variant === item} onChange={() => { setVariant(item); preview({ variant: item }); }} className="sr-only" />
          <Sketch variant={item} /><span className="text-center text-sm font-semibold">{labels.variants[item]}</span>
        </label>)}</div>
    </fieldset>
    {variant !== 'minimal' && <div className="flex flex-col gap-2">
      <span className="font-semibold">{labels.photo}</span>
      <MediaPicker storeId={storeId} folder="blocks" initial={assets} labels={mediaLabels} name="coverAsset"
        current={asset?.id} onSelect={(selected) => { setAsset({ id: selected.id, alt: selected.alt_text ?? '' }); preview({ assetId: selected.id }); }} />
    </div>}
    {message && <p role={message.ok ? 'status' : 'alert'} className={`m-0 rounded-xl p-3 ${message.ok ? 'bg-[#173b2e] text-[#7ee2b3]' : 'bg-[#3b1a20] text-[#ff9aa5]'}`}>{message.text}</p>}
    <button type="button" className="auth-primary w-full" disabled={pending || !title.trim()} onClick={save}>{labels.save}</button>
  </div>;
}
