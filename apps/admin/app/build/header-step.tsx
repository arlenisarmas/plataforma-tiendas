'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { curatedPalettes } from '@plataforma/blocks';
import { headerTheme, type HeaderChoice } from '../../lib/build-blocks';
import { saveHeader } from './actions';
import { sendPreviewChange } from './build-preview';
import { ChoiceGroup, SaveMessage } from './choice-group';

type Labels = { colors: string; layout: string; style: string; fonts: string; save: string; error: string;
  names: Record<string, string>; styles: { claro: string; color: string } };

const fontFamilies = { moderna: 'Arial, sans-serif', clasica: 'Georgia, serif', amigable: 'Verdana, sans-serif', robusta: 'Tahoma, sans-serif' };

function HeaderSketch({ layout, style, color }: { layout: HeaderChoice['layout']; style: HeaderChoice['style']; color: string }) {
  const bar = style === 'color' ? color : '#ffffff';
  const ink = style === 'color' ? '#ffffff' : color;
  const centered = layout === 'centrado';
  return <svg viewBox="0 0 120 64" className="h-auto w-full rounded-lg" aria-hidden="true">
    <rect width="120" height="64" fill="#f4f5f8" />
    <rect width="120" height={centered ? 30 : 20} fill={bar} />
    <rect y={centered ? 30 : 20} width="120" height="1.5" fill={color} />
    <circle cx={centered ? 60 : 12} cy={centered ? 10 : 10} r="5" fill={ink} />
    <rect x={centered ? 44 : 21} y={centered ? 18 : 7} width="32" height="5" rx="2" fill={ink} />
    {!centered && <><rect x="80" y="8" width="12" height="4" rx="2" fill={ink} opacity=".7" /><rect x="97" y="8" width="14" height="4" rx="2" fill={ink} opacity=".7" /></>}
    <rect x="12" y={centered ? 40 : 32} width="96" height="18" rx="3" fill="#e2e5ec" />
  </svg>;
}

export function HeaderStep({ storeId, initial, initialTheme, labels, nextHref }: {
  storeId: string; initial: HeaderChoice; initialTheme: unknown; labels: Labels; nextHref: string;
}) {
  const router = useRouter();
  const [choice, setChoice] = useState(initial);
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();
  const update = (change: Partial<HeaderChoice>) => {
    const next = { ...choice, ...change };
    setChoice(next);
    try { sendPreviewChange({ theme: headerTheme(initialTheme, next) }); } catch { /* La vista previa se actualiza al guardar. */ }
  };
  const save = () => start(async () => {
    const result = await saveHeader({ storeId, ...choice });
    if (result.error) { setError(true); return; }
    router.push(nextHref);
  });
  const primary = curatedPalettes[choice.palette].primary;
  return <div className="flex flex-col gap-6">
    <ChoiceGroup legend={labels.colors} name="palette" value={choice.palette} columns={5} onChange={(palette) => update({ palette })}
      options={(Object.keys(curatedPalettes) as HeaderChoice['palette'][]).map((key) => ({ value: key, label: labels.names[key] ?? key,
        picture: <span aria-hidden="true" className="flex h-12 overflow-hidden rounded-lg">
          {(['primary', 'accent', 'surface'] as const).map((tone) => <span key={tone} className="flex-1" style={{ background: curatedPalettes[key][tone] }} />)}
        </span> }))} />
    <ChoiceGroup legend={labels.layout} name="layout" value={choice.layout} columns={2} onChange={(layout) => update({ layout })}
      options={(['izquierda', 'centrado'] as const).map((layout) => ({ value: layout, label: labels.names[layout] ?? layout,
        picture: <HeaderSketch layout={layout} style={choice.style} color={primary} /> }))} />
    <ChoiceGroup legend={labels.style} name="style" value={choice.style} columns={2} onChange={(style) => update({ style })}
      options={(['claro', 'color'] as const).map((style) => ({ value: style, label: labels.styles[style],
        picture: <HeaderSketch layout={choice.layout} style={style} color={primary} /> }))} />
    <ChoiceGroup legend={labels.fonts} name="fonts" value={choice.fonts} columns={2} onChange={(fonts) => update({ fonts })}
      options={(['moderna', 'clasica', 'amigable', 'robusta'] as const).map((font) => ({ value: font, label: labels.names[font] ?? font,
        picture: <span aria-hidden="true" className="flex h-12 items-center justify-center rounded-lg bg-white text-2xl text-[#1c1f2a]" style={{ fontFamily: fontFamilies[font] }}>Aa</span> }))} />
    <SaveMessage message={error ? { ok: false, text: labels.error } : null} />
    <button type="button" className="auth-primary w-full" disabled={pending} onClick={save}>{labels.save}</button>
  </div>;
}
