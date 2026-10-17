'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Device = 'desktop' | 'mobile';
type Labels = { title: string; help: string; desktop: string; mobile: string; unavailable: string };

const widths: Record<Device, number> = { desktop: 1280, mobile: 390 };
const heights: Record<Device, number> = { desktop: 800, mobile: 780 };

/** Cambios en vivo: los pasos del armado avisan con este evento y la vista previa los manda a la tienda. */
export type PreviewChange = { blocks?: unknown; theme?: unknown };
export function sendPreviewChange(change: PreviewChange) {
  window.dispatchEvent(new CustomEvent<PreviewChange>('build-preview', { detail: change }));
}
/** Pide recargar la vista previa (por ejemplo, después de subir el logo). */
export function reloadPreview() {
  window.dispatchEvent(new Event('build-preview-reload'));
}

export function BuildPreview({ src, origin, token, initialBlocks, initialTheme, labels }: {
  src: string | null; origin: string; token: string; initialBlocks: unknown; initialTheme: unknown; labels: Labels;
}) {
  const [device, setDevice] = useState<Device>('desktop');
  const [scale, setScale] = useState(1);
  const [reloads, setReloads] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const latest = useRef<{ blocks: unknown; theme: unknown }>({ blocks: initialBlocks, theme: initialTheme });

  const choose = (value: Device) => setDevice(value);

  // Escala el marco para que la página completa entre en el espacio disponible.
  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const update = () => setScale(Math.min(1, element.clientWidth / (widths[device] + (device === 'mobile' ? 20 : 2))));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [device]);

  const post = useCallback(() => {
    frame.current?.contentWindow?.postMessage({ type: 'preview-update', token, ...latest.current }, origin);
  }, [origin, token]);

  useEffect(() => {
    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<PreviewChange>).detail;
      latest.current = { blocks: detail.blocks ?? latest.current.blocks, theme: detail.theme ?? latest.current.theme };
      post();
    };
    const onReload = () => setReloads((value) => value + 1);
    window.addEventListener('build-preview', onChange);
    window.addEventListener('build-preview-reload', onReload);
    return () => {
      window.removeEventListener('build-preview', onChange);
      window.removeEventListener('build-preview-reload', onReload);
    };
  }, [post]);

  const toggle = (value: Device, label: string, icon: string) =>
    <button type="button" onClick={() => choose(value)} aria-pressed={device === value}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold ${device === value
        ? 'bg-[#2b2f55] text-[#e9ebf2]' : 'border border-[#2a2f3c] text-[#c9cdd8]'}`}>
      <span aria-hidden="true">{icon}</span>{label}
    </button>;

  return <section aria-label={labels.title} className="flex min-w-0 flex-col gap-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-sm font-semibold text-[#a3a9b8]">{labels.title}</span>
      <div className="flex gap-2" role="group" aria-label={labels.title}>
        {toggle('desktop', labels.desktop, '💻')}{toggle('mobile', labels.mobile, '📱')}
      </div>
    </div>
    <div ref={box} className="w-full overflow-hidden" style={{ height: heights[device] * scale }}>
      {src
        ? <div className={device === 'mobile' ? 'mx-auto rounded-[2.25rem] border-[10px] border-[#262a36] bg-[#262a36]' : 'rounded-2xl border border-[#232733]'}
            style={{ width: widths[device] + (device === 'mobile' ? 20 : 2), transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            <iframe key={`${device}-${reloads}`} ref={frame} title={labels.title} src={src} onLoad={post}
              className={`block bg-white ${device === 'mobile' ? 'rounded-[1.6rem]' : 'rounded-2xl'}`}
              style={{ width: widths[device], height: heights[device] - (device === 'mobile' ? 20 : 2) }} />
          </div>
        : <div className="flex h-[320px] items-center justify-center rounded-2xl border border-dashed border-[#3a3f55] p-6 text-center text-[#a3a9b8]">{labels.unavailable}</div>}
    </div>
    <span className="text-[13px] text-[#a3a9b8]">{labels.help}</span>
  </section>;
}
