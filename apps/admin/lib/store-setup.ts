import { z } from 'zod';

// Países donde hay tiendas previstas. Venezuela usa USD por defecto: es la moneda en la que
// la mayoría de los comercios publica precios (el bolívar se puede habilitar más adelante).
export const countryDefaults = {
  AR: { currency: 'ARS', timezone: 'America/Argentina/Buenos_Aires', locale: 'es-AR' },
  CL: { currency: 'CLP', timezone: 'America/Santiago', locale: 'es-419' },
  CO: { currency: 'COP', timezone: 'America/Bogota', locale: 'es-419' },
  ES: { currency: 'EUR', timezone: 'Europe/Madrid', locale: 'es-419' },
  MX: { currency: 'MXN', timezone: 'America/Mexico_City', locale: 'es-419' },
  PE: { currency: 'PEN', timezone: 'America/Lima', locale: 'es-419' },
  US: { currency: 'USD', timezone: 'America/New_York', locale: 'en' },
  UY: { currency: 'UYU', timezone: 'America/Montevideo', locale: 'es-419' },
  VE: { currency: 'USD', timezone: 'America/Caracas', locale: 'es-419' },
} as const;

export type CountryCode = keyof typeof countryDefaults;
export const countryCodes = Object.keys(countryDefaults) as [CountryCode, ...CountryCode[]];

export const storeSetupSchema = z.object({
  name: z.string().trim().min(1).max(80),
  slug: z
    .string()
    .regex(/^[a-z0-9](-?[a-z0-9])*$/)
    .min(3)
    .max(40),
  industry: z.enum([
    'mascotas',
    'carpinteria-muebles',
    'ropa-accesorios',
    'comida-casera',
    'general',
  ]),
  country: z.enum(countryCodes),
  locale: z.enum(['es-419', 'es-AR', 'en']),
  timezone: z
    .string()
    .min(3)
    .max(80)
    .refine((value) => {
      try {
        new Intl.DateTimeFormat('en', { timeZone: value });
        return true;
      } catch {
        return false;
      }
    }),
  palette: z.enum(['calido', 'fresco', 'natural', 'elegante', 'vibrante']),
});
