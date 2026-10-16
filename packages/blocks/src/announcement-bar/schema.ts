import { z } from 'zod';
import { safeUrl } from '../content-utils';
export const announcementBarSchema = z.object({ text: z.string().max(180), button: z.object({ label: z.string().min(1).max(60), href: safeUrl }).optional() });
