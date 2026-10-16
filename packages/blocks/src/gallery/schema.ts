import { z } from 'zod';
import { asset } from '../content-utils';
export const gallerySchema = z.object({ title: z.string().max(120).default(''), images: z.array(asset).max(12).default([]) });
