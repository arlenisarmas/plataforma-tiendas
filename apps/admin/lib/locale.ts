import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { isLocale, type Locale } from '@plataforma/i18n';

export async function adminLocale(): Promise<Locale> {
  const value = (await cookies()).get('admin-locale')?.value;
  return value && isLocale(value) ? value : 'es-419';
}

export async function adminText() {
  return getTranslations({ locale: await adminLocale(), namespace: 'admin' });
}
