import { z } from 'zod';
import { toMinor, type CurrencyCode } from '@plataforma/core';

export const shippingSchema = z.object({ storeId: z.uuid(), id: z.uuid().optional(),
  kind: z.enum(['pickup', 'flat_rate']), name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(300), price: z.string(), freeOver: z.string(), active: z.boolean() });
export const paymentSchema = z.object({ storeId: z.uuid(), method: z.enum(['transferencia', 'pago-movil', 'zelle', 'efectivo']),
  displayName: z.string().trim().min(1).max(80), fields: z.record(z.string(), z.string().trim().max(160)) });

const requiredFields = { transferencia: ['holder', 'bank', 'account'], 'pago-movil': ['holder', 'bank', 'phone'],
  zelle: ['holder', 'email'], efectivo: ['note'] } as const;

export function parseShipping(raw: unknown, currency: CurrencyCode, locale: string) {
  const input = shippingSchema.parse(raw);
  const price = input.kind === 'pickup' ? 0n : toMinor(input.price, currency, locale).amount;
  const threshold = input.kind === 'pickup' || !input.freeOver ? null : toMinor(input.freeOver, currency, locale).amount;
  if (price < 0n || (threshold !== null && threshold <= 0n)) throw new RangeError('Invalid shipping amounts');
  return { ...input, priceAmount: price.toString(), freeOverAmount: threshold?.toString() ?? null };
}

export function parsePayment(raw: unknown) {
  const input = paymentSchema.parse(raw);
  const fields = Object.fromEntries(requiredFields[input.method].map((field) => [field, input.fields[field]?.trim() ?? '']));
  if (Object.values(fields).some((value) => !value)) throw new RangeError('Missing payment details');
  if (input.method === 'zelle' && !z.email().safeParse(fields.email).success) throw new RangeError('Invalid email');
  return { ...input, fields };
}
