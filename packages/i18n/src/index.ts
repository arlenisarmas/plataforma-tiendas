import commonEs419 from '../messages/es-419/common.json';
import adminEs419 from '../messages/es-419/admin.json';
import storefrontEs419 from '../messages/es-419/storefront.json';
import blocksEs419 from '../messages/es-419/blocks.json';
import errorsEs419 from '../messages/es-419/errors.json';
import commonEsAr from '../messages/es-AR/common.json';
import adminEsAr from '../messages/es-AR/admin.json';
import storefrontEsAr from '../messages/es-AR/storefront.json';
import blocksEsAr from '../messages/es-AR/blocks.json';
import errorsEsAr from '../messages/es-AR/errors.json';
import commonEn from '../messages/en/common.json';
import adminEn from '../messages/en/admin.json';
import storefrontEn from '../messages/en/storefront.json';
import blocksEn from '../messages/en/blocks.json';
import errorsEn from '../messages/en/errors.json';

export const locales = ['es-419', 'es-AR', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'es-419';

export const messages = {
  'es-419': {
    common: commonEs419,
    admin: adminEs419,
    storefront: storefrontEs419,
    blocks: blocksEs419,
    errors: errorsEs419,
  },
  'es-AR': {
    common: commonEsAr,
    admin: adminEsAr,
    storefront: storefrontEsAr,
    blocks: blocksEsAr,
    errors: errorsEsAr,
  },
  en: {
    common: commonEn,
    admin: adminEn,
    storefront: storefrontEn,
    blocks: blocksEn,
    errors: errorsEn,
  },
} as const;

export function isLocale(value: string): value is Locale {
  return locales.some((locale) => locale === value);
}

export function formatDate(value: Date | number, locale: Locale, timeZone: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone }).format(value);
}

export function formatRelative(
  value: Date | number,
  locale: Locale,
  timeZone: string,
  now: Date | number = Date.now(),
): string {
  // Valida la zona horaria (lanza RangeError si no existe) antes de calcular la diferencia.
  new Intl.DateTimeFormat(locale, { timeZone });
  const seconds = (Number(value) - Number(now)) / 1000;
  const absolute = Math.abs(seconds);
  const [unit, divisor] =
    absolute < 60
      ? (['second', 1] as const)
      : absolute < 3600
        ? (['minute', 60] as const)
        : absolute < 86400
          ? (['hour', 3600] as const)
          : (['day', 86400] as const);
  return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(
    Math.round(seconds / divisor),
    unit,
  );
}
