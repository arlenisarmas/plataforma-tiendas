export const CURRENCY_EXPONENTS = {
  ARS: 2,
  CLP: 0,
  USD: 2,
  EUR: 2,
  MXN: 2,
  COP: 2,
  PEN: 2,
  UYU: 2,
  BRL: 2,
  VES: 2,
} as const;

export type CurrencyCode = keyof typeof CURRENCY_EXPONENTS;
export type Money = Readonly<{ amount: bigint; currency: CurrencyCode }>;

function multiplier(currency: CurrencyCode): bigint {
  return 10n ** BigInt(CURRENCY_EXPONENTS[currency]);
}

function separators(locale: string): { group: string; decimal: string } {
  const parts = new Intl.NumberFormat(locale).formatToParts(1234.5);
  return {
    group: parts.find((part) => part.type === 'group')?.value ?? ',',
    decimal: parts.find((part) => part.type === 'decimal')?.value ?? '.',
  };
}

export function toMinor(value: string, currency: CurrencyCode, locale: string): Money {
  const { group, decimal } = separators(locale);
  const exponent = CURRENCY_EXPONENTS[currency];
  const normalized = value
    .trim()
    .replaceAll('\u00a0', '')
    .replaceAll('\u202f', '')
    .replaceAll(' ', '')
    .replaceAll(group, '');
  const sign = normalized.startsWith('-') ? -1n : 1n;
  const unsigned = sign < 0n ? normalized.slice(1) : normalized;
  const segments = unsigned.split(decimal);
  const whole = segments[0];
  const fraction = segments[1] ?? '';
  if (
    segments.length > 2 ||
    !whole ||
    !/^\d+$/.test(whole) ||
    (fraction && !/^\d+$/.test(fraction)) ||
    fraction.length > exponent ||
    (segments.length === 2 && exponent === 0)
  ) {
    throw new RangeError('Invalid monetary amount for locale and currency');
  }
  return {
    amount:
      sign * (BigInt(whole) * multiplier(currency) + BigInt(fraction.padEnd(exponent, '0') || '0')),
    currency,
  };
}

function formatParts(
  amount: bigint,
  currency: CurrencyCode,
  locale: string,
  style: 'decimal' | 'currency',
): string {
  const exponent = CURRENCY_EXPONENTS[currency];
  const factor = multiplier(currency);
  const absolute = amount < 0n ? -amount : amount;
  const integer = absolute / factor;
  const fraction = absolute % factor;
  const formatter = new Intl.NumberFormat(locale, {
    style,
    ...(style === 'currency' ? { currency } : {}),
    minimumFractionDigits: exponent,
    maximumFractionDigits: exponent,
  });
  const template = formatter.formatToParts(amount < 0n ? -1.01 : 1.01);
  const grouped = new Intl.NumberFormat(locale, { useGrouping: true }).format(integer);
  const localizedFraction = exponent
    ? new Intl.NumberFormat(locale, { useGrouping: false, minimumIntegerDigits: exponent }).format(
        fraction,
      )
    : '';
  let insertedInteger = false;
  return template
    .map((part) => {
      if (part.type === 'integer') {
        if (insertedInteger) return '';
        insertedInteger = true;
        return grouped;
      }
      if (part.type === 'group') return '';
      if (part.type === 'fraction') return localizedFraction;
      return part.value;
    })
    .join('');
}

export function fromMinor(amount: bigint, currency: CurrencyCode, locale: string): string {
  return formatParts(amount, currency, locale, 'decimal');
}

export function formatMoney(money: Money, locale: string): string {
  return formatParts(money.amount, money.currency, locale, 'currency');
}

function assertSameCurrency(left: Money, right: Money): void {
  if (left.currency !== right.currency) throw new TypeError('Currency mismatch');
}

export function addMoney(left: Money, right: Money): Money {
  assertSameCurrency(left, right);
  return { amount: left.amount + right.amount, currency: left.currency };
}

export function subtractMoney(left: Money, right: Money): Money {
  assertSameCurrency(left, right);
  return { amount: left.amount - right.amount, currency: left.currency };
}

export function multiplyMoney(money: Money, factor: number | bigint): Money {
  if (typeof factor === 'number' && !Number.isSafeInteger(factor))
    throw new RangeError('Factor must be a safe integer');
  return { amount: money.amount * BigInt(factor), currency: money.currency };
}
