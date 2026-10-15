import { describe, expect, it } from 'vitest';
import { isValidSlug, isValidStoreSlug, slugify } from './slug';

describe('slugs', () => {
  it('normalizes accents and ñ', () =>
    expect(slugify('Mesa Ratona Ñandú')).toBe('mesa-ratona-nandu'));
  it('collapses separators', () => expect(slugify('  ¡Hola---Mundo!  ')).toBe('hola-mundo'));
  it('matches the database regex', () => {
    expect(isValidSlug('mesa-ratona')).toBe(true);
    expect(isValidSlug('-mesa')).toBe(false);
    expect(isValidSlug('mesa--ratona')).toBe(false);
    expect(isValidStoreSlug('ok')).toBe(false);
    expect(isValidStoreSlug('tienda')).toBe(true);
    expect(isValidStoreSlug('a'.repeat(41))).toBe(false);
  });
});
