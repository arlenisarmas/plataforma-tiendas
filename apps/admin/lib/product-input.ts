import { slugify, toMinor, type CurrencyCode } from '@plataforma/core';
import { z } from 'zod';

const optionSchema = z.record(z.string().trim().min(1).max(40), z.string().trim().min(1).max(80));
export const productInputSchema = z.object({
  storeId: z.uuid(), name: z.string().trim().min(1).max(140), slug: z.string().trim().max(140).optional(),
  description: z.string().trim().max(10000).optional(), categoryId: z.uuid().optional(), assetId: z.uuid().optional(),
  status: z.enum(['draft', 'active']),
  variants: z.array(z.object({ title: z.string().trim().min(1).max(140), options: optionSchema,
    price: z.string().min(1), compareAt: z.string().optional(), cost: z.string().optional(),
    sku: z.string().trim().max(64).optional(), weightGrams: z.number().int().min(0).optional(),
    stock: z.number().int().min(0).max(1_000_000),
  })).min(1).max(50),
}).superRefine((value, ctx) => {
  const slug = value.slug || slugify(value.name);
  if (!/^[a-z0-9](-?[a-z0-9])*$/.test(slug)) ctx.addIssue({ code: 'custom', path: ['slug'], message: 'Invalid address' });
});

export function parseProductInput(value: unknown, currency: CurrencyCode, locale: string) {
  const input = productInputSchema.parse(value);
  const amount = (value: string) => {
    const minor = toMinor(value, currency, locale).amount;
    if (minor < 0n || minor > BigInt(Number.MAX_SAFE_INTEGER)) throw new RangeError('Invalid price');
    return Number(minor);
  };
  return { ...input, slug: input.slug || slugify(input.name), variants: input.variants.map((variant) => ({
    ...variant, priceAmount: amount(variant.price),
    compareAtAmount: variant.compareAt ? amount(variant.compareAt) : null,
    costAmount: variant.cost ? amount(variant.cost) : null,
  })) };
}
