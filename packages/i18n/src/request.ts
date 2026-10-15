import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, isLocale, messages } from './index';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = requested && isLocale(requested) ? requested : defaultLocale;
  return { locale, messages: messages[locale] };
});
