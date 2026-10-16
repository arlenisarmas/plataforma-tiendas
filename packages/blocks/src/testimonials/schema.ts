import { z } from 'zod';
export const testimonialsSchema = z.object({ title: z.string().max(120).default(''), items: z.array(z.object({ quote: z.string().min(1).max(600), author: z.string().min(1).max(100) })).max(8).default([]) });
