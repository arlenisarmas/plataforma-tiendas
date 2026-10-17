'use client';

import { useState, useTransition } from 'react';
import { saveProductsLayout } from './actions';
import { sendPreviewChange } from './build-preview';
import { ChoiceGroup, SaveMessage } from './choice-group';

type Variant = 'grid' | 'carousel' | 'featured-list';
type Labels = { title: string; help: string; save: string; saved: string; error: string; variants: Record<Variant, string> };

function Sketch({ variant }: { variant: Variant }) {
  const card = (x: number, y: number, w: number, h: number) => <g key={`${x}-${y}`}>
    <rect x={x} y={y} width={w} height={h} rx="3" fill="#ffffff" stroke="#d9dce4" />
    <rect x={x + 3} y={y + 3} width={w - 6} height={h * 0.55} rx="2" fill="#b9b3d6" />
    <rect x={x + 3} y={y + h * 0.7} width={w * 0.6} height="3" rx="1.5" fill="#6a6070" />
  </g>;
  return <svg viewBox="0 0 120 72" className="h-auto w-full rounded-lg" aria-hidden="true">
    <rect width="120" height="72" fill="#f4f5f8" />
    {variant === 'grid' && [0, 1, 2].flatMap((col) => [0, 1].map((row) => card(8 + col * 36, 6 + row * 32, 32, 28)))}
    {variant === 'carousel' && <>{[0, 1, 2].map((col) => card(14 + col * 34, 14, 30, 44))}
      <circle cx="7" cy="36" r="4" fill="#6a4c9c" /><circle cx="113" cy="36" r="4" fill="#6a4c9c" /></>}
    {variant === 'featured-list' && [0, 1, 2].map((row) => <g key={row}>
      <rect x="8" y={6 + row * 21} width="104" height="18" rx="3" fill="#ffffff" stroke="#d9dce4" />
      <rect x="11" y={9 + row * 21} width="16" height="12" rx="2" fill="#b9b3d6" />
      <rect x="32" y={12 + row * 21} width="44" height="4" rx="2" fill="#6a6070" />
      <rect x="92" y={12 + row * 21} width="16" height="5" rx="2.5" fill="#6a4c9c" />
    </g>)}
  </svg>;
}

/** Elige cómo se ven los productos en la página de inicio, con vista previa en vivo. */
export function ProductsLayout({ storeId, initial, blocks, labels }: {
  storeId: string; initial: Variant; blocks: unknown[]; labels: Labels;
}) {
  const [variant, setVariant] = useState<Variant>(initial);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const choose = (next: Variant) => {
    setVariant(next); setMessage(null);
    sendPreviewChange({ blocks: blocks.map((block) => typeof block === 'object' && block !== null && (block as { type?: unknown }).type === 'featured-products'
      ? { ...block, variant: next } : block) });
  };
  const save = () => start(async () => {
    const result = await saveProductsLayout({ storeId, variant });
    setMessage(result.error ? { ok: false, text: labels.error } : { ok: true, text: labels.saved });
  });
  return <div className="flex flex-col gap-4 border-t border-[#2a2f3c] pt-5">
    <div><strong className="block">{labels.title}</strong><span className="text-[15px] text-[#a3a9b8]">{labels.help}</span></div>
    <ChoiceGroup legend={labels.title} name="productsLayout" value={variant} onChange={choose}
      options={(['grid', 'carousel', 'featured-list'] as const).map((item) => ({ value: item, label: labels.variants[item], picture: <Sketch variant={item} /> }))} />
    <SaveMessage message={message} />
    <button type="button" className="auth-secondary w-full" disabled={pending} onClick={save}>{labels.save}</button>
  </div>;
}
