import { z } from 'zod';

export const countryDefaults = {
  AR: { currency: 'ARS', timezone: 'America/Argentina/Buenos_Aires', locale: 'es-AR' },
  CL: { currency: 'CLP', timezone: 'America/Santiago', locale: 'es-419' },
  US: { currency: 'USD', timezone: 'America/New_York', locale: 'en' },
} as const;

export const storeSetupSchema = z.object({
  name: z.string().trim().min(1).max(80),
  slug: z.string().regex(/^[a-z0-9](-?[a-z0-9])*$/).min(3).max(40),
  industry: z.literal('general'),
  country: z.enum(['AR', 'CL', 'US']),
  locale: z.enum(['es-419', 'es-AR', 'en']),
  timezone: z.string().min(3).max(80).refine((value) => {
    try { new Intl.DateTimeFormat('en', { timeZone: value }); return true; } catch { return false; }
  }),
  palette: z.enum(['calido', 'fresco', 'natural', 'elegante', 'vibrante']),
});
