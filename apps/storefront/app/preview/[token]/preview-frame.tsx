'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { StoreLayout, type Theme } from '@plataforma/blocks';
import { updatePreview } from './actions';

export function PreviewFrame({ token, origin, initial, theme, storeName }: { token: string; origin: string;
  initial: ReactNode; theme: Theme; storeName: string }) {
  const [nodes, setNodes] = useState(initial);
  const [currentTheme, setTheme] = useState(theme);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin !== origin || event.source !== window.parent || !event.data || event.data.type !== 'preview-update'
        || event.data.token !== token) return;
      void updatePreview(token, event.data.blocks, event.data.theme).then((updated) => {
        if (updated) { setNodes(updated.nodes); setTheme(updated.theme); }
      }).catch(() => { /* Keep the last valid preview while the editor retries. */ });
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [token, origin]);
  return <StoreLayout theme={currentTheme} storeName={storeName} homeHref="/">{nodes}</StoreLayout>;
}
