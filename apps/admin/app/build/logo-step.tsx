'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { MediaPicker } from '../media-picker';
import { saveLogo } from './actions';
import { reloadPreview } from './build-preview';
import { SaveMessage } from './choice-group';

type Asset = { id: string; path: string; alt_text: string | null; size_bytes: number };
type MediaLabels = Parameters<typeof MediaPicker>[0]['labels'];
type Labels = { sizeTitle: string; size: string; tips: string[]; upload: string; saved: string; error: string; next: string; skip: string };

export function LogoStep({ storeId, current, assets, mediaLabels, labels, nextHref }: {
  storeId: string; current: string | null; assets: Asset[]; mediaLabels: MediaLabels; labels: Labels; nextHref: string;
}) {
  const router = useRouter();
  const [logo, setLogo] = useState(current);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  // Al elegir o subir una imagen se guarda enseguida y la vista previa la muestra arriba.
  const choose = (assetId: string) => start(async () => {
    const result = await saveLogo({ storeId, assetId });
    if (result.error) { setMessage({ ok: false, text: labels.error }); return; }
    setLogo(assetId); setMessage({ ok: true, text: labels.saved }); reloadPreview();
  });
  const finish = () => start(async () => {
    const result = await saveLogo({ storeId, assetId: logo });
    if (result.error) { setMessage({ ok: false, text: labels.error }); return; }
    router.push(nextHref);
  });
  return <div className="flex flex-col gap-5">
    <div className="rounded-xl border border-[#2f3a66] bg-[#1a2040] p-4">
      <strong className="block text-[#e9ebf2]">📐 {labels.sizeTitle}</strong>
      <p className="m-0 mt-1 text-[#c9cdd8]">{labels.size}</p>
      <ul className="m-0 mt-3 flex list-none flex-col gap-1.5 p-0 text-[15px] text-[#c9cdd8]">
        {labels.tips.map((tip) => <li key={tip} className="flex gap-2"><span aria-hidden="true">✓</span>{tip}</li>)}
      </ul>
    </div>
    <div className="flex flex-col gap-2">
      <span className="font-semibold">{labels.upload}</span>
      <MediaPicker storeId={storeId} folder="logos" initial={assets} labels={mediaLabels} name="logoAsset"
        current={logo ?? undefined} onSelect={(asset) => choose(asset.id)} />
    </div>
    <SaveMessage message={message} />
    <div className="flex flex-col gap-3 sm:flex-row">
      <button type="button" className="auth-primary flex-1" disabled={pending || !logo} onClick={finish}>{labels.next}</button>
      {!logo && <button type="button" className="auth-secondary" disabled={pending} onClick={finish}>{labels.skip}</button>}
    </div>
  </div>;
}
