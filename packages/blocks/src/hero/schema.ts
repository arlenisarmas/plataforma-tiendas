import { z } from 'zod';

const link = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('collection'), categoryId: z.uuid().nullable() }),
  z.object({ kind: z.literal('url'), href: z.url().refine((url) => /^https?:\/\//i.test(url)) }),
]);

export const heroSchema = z.object({
  title: z.string().max(120),
  subtitle: z.string().max(240).optional(),
  image: z.object({ assetId: z.uuid(), alt: z.string().min(1) }).optional(),
  cta: z.object({ label: z.string().min(1), link }).optional(),
  align: z.enum(['left', 'center']).default('left'),
});
