import { describe, expect, it } from 'vitest';
import { addMoney, formatMoney, fromMinor, multiplyMoney, subtractMoney, toMinor } from './money';

describe('money', () => {
  it('parses ARS in es-AR without losing cents', () =>
    expect(toMinor('15.000,50', 'ARS', 'es-AR')).toEqual({ amount: 1500050n, currency: 'ARS' }));
  it('parses CLP without decimals', () =>
    expect(toMinor('15.000', 'CLP', 'es-CL').amount).toBe(15000n));
  it('parses USD in en-US', () =>
    expect(toMinor('15,000.50', 'USD', 'en-US').amount).toBe(1500050n));
  it('rejects excess precision and malformed amounts', () => {
    expect(() => toMinor('1,234', 'ARS', 'es-AR')).toThrow();
    expect(() => toMinor('1,5', 'CLP', 'es-CL')).toThrow();
    expect(() => toMinor('abc', 'USD', 'en-US')).toThrow();
  });
  it('preserves amounts larger than 2^53', () => {
    const amount = 900719925474099399n;
    expect(toMinor(fromMinor(amount, 'USD', 'en-US'), 'USD', 'en-US').amount).toBe(amount);
    expect(formatMoney({ amount, currency: 'USD' }, 'en-US')).toContain('9,007,199,254,740,993.99');
  });
  it('handles negatives and currency layout', () => {
    expect(fromMinor(-12345n, 'ARS', 'es-AR')).toContain('-');
    expect(formatMoney({ amount: 12345n, currency: 'ARS' }, 'es-AR')).toContain('123,45');
  });
  it('adds, subtracts and multiplies exactly', () => {
    const one = { amount: 100n, currency: 'USD' as const };
    expect(addMoney(one, one).amount).toBe(200n);
    expect(subtractMoney(one, one).amount).toBe(0n);
    expect(multiplyMoney(one, 3).amount).toBe(300n);
    expect(multiplyMoney(one, 3n).amount).toBe(300n);
    expect(() => multiplyMoney(one, 1.5)).toThrow();
    expect(() => addMoney(one, { amount: 1n, currency: 'ARS' })).toThrow();
  });
});
