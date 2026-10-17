import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs' || !process.env.SENTRY_DSN) return;
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0,
    beforeSend(event) {
      delete event.request;
      delete event.user;
      delete event.breadcrumbs;
      if (event.message) event.message = 'Application error';
      for (const value of event.exception?.values ?? []) value.value = 'Application error';
      return event;
    },
  });
}

export const onRequestError = Sentry.captureRequestError;
