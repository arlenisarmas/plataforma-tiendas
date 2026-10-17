import { describe, expect, it } from 'vitest';
import { defaultLocale, formatDate, formatRelative, locales, messages } from './index';

const namespaces = ['common', 'admin', 'storefront', 'blocks', 'errors'] as const;

describe('message catalogs', () => {
  it('keeps every baseline key in the Argentine and English catalogs', () => {
    for (const locale of locales) {
      for (const namespace of namespaces) {
        const expected = Object.keys(messages[defaultLocale][namespace]);
        expect(Object.keys(messages[locale][namespace]).sort()).toEqual(expected.sort());
        expect(Object.values(messages[locale][namespace]).every(Boolean)).toBe(true);
      }
    }
  });

  it('does not expose technical jargon in Spanish admin or common text', () => {
    for (const locale of ['es-419', 'es-AR'] as const) {
      const text = Object.values(messages[locale].admin)
        .concat(Object.values(messages[locale].common))
        .join(' ');
      expect(text).not.toMatch(/\b(?:dashboard|SKU|checkout|slug|webhook|deploy)\b/i);
    }
  });
});

describe('store-aware formatting', () => {
  it('formats a date in the requested locale and timezone', () => {
    const instant = new Date('2026-10-16T02:00:00Z');
    expect(formatDate(instant, 'es-AR', 'America/Argentina/Buenos_Aires')).toContain('15');
    expect(formatDate(instant, 'en', 'UTC')).toContain('16');
  });

  it('formats elapsed time in the requested locale', () => {
    const now = new Date('2026-10-15T12:05:00Z');
    const before = new Date('2026-10-15T12:00:00Z');
    expect(formatRelative(before, 'es-419', 'UTC', now)).toContain('5 minutos');
    expect(formatRelative(before, 'en', 'UTC', now)).toContain('5 minutes');
  });
});
