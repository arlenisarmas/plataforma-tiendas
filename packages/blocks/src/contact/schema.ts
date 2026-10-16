import { z } from 'zod';
import { safeUrl } from '../content-utils';
export const contactSchema = z.object({ title: z.string().max(120).default(''), whatsappMessage: z.string().max(300).default(''),
  mapUrl: safeUrl.optional() });
export const contactDataSchema = z.object({ whatsapp: z.string().max(40).optional(), phone: z.string().max(40).optional(),
  email: z.email().optional(), address: z.string().max(400).optional(), hours: z.string().max(400).optional(),
  social: z.array(z.object({ label: z.string().max(80), url: safeUrl })).max(8).optional() });
