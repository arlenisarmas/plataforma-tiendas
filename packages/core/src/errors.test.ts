import { describe, expect, it } from 'vitest';
import { BUSINESS_ERROR_CODES, parseDbError } from './errors';

describe('database errors', () => {
  it('recognizes every documented business code', () => {
    expect(BUSINESS_ERROR_CODES).toHaveLength(20);
    for (const code of BUSINESS_ERROR_CODES)
      expect(parseDbError({ message: `ERROR: ${code}` })).toBe(code);
  });
  it('checks details, hint and code', () => {
    expect(parseDbError({ details: 'STOCK_INSUFICIENTE' })).toBe('STOCK_INSUFICIENTE');
    expect(parseDbError({ hint: 'SIN_PERMISO' })).toBe('SIN_PERMISO');
    expect(parseDbError({ code: 'PAGO_NO_EXISTE' })).toBe('PAGO_NO_EXISTE');
  });
  it('does not mistake unknown text for a business code', () => {
    expect(parseDbError(null)).toBe('UNKNOWN');
    expect(parseDbError({ message: 'FOO_STOCK_INSUFICIENTE_BAR' })).toBe('UNKNOWN');
  });
});
