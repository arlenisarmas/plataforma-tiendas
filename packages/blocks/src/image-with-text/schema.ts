import { z } from 'zod';
import { asset, safeUrl } from '../content-utils';
export const imageWithTextSchema = z.object({ title: z.string().max(120), body: z.string().max(1200), image: asset,
  button: z.object({ label: z.string().min(1).max(60), href: safeUrl }).optional() });
