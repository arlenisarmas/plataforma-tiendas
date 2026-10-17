import { z } from 'zod';

export const richTextSchema = z.object({
  title: z.string().max(120).optional(),
  body: z.string().max(10000),
});
