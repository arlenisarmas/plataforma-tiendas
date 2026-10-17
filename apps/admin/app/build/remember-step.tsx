'use client';

import { useEffect } from 'react';
import { rememberStep } from './actions';

/** Guarda en qué paso está la persona para retomar desde ahí la próxima vez. */
export function RememberStep({ storeId, step }: { storeId: string; step: string }) {
  useEffect(() => { void rememberStep({ storeId, step }).catch(() => undefined); }, [storeId, step]);
  return null;
}
