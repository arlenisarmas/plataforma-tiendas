import { z } from 'zod';
export const faqSchema = z.object({ title: z.string().max(120).default(''), items: z.array(z.object({ question: z.string().min(1).max(220), answer: z.string().min(1).max(2000) })).max(12).default([]) });
