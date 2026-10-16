import { z } from 'zod';

export const featuredProductsSchema = z.object({ title: z.string().max(120).default(''), limit: z.number().int().min(1).max(12).default(8) });
export const categoryGridSchema = z.object({ title: z.string().max(120).default(''), limit: z.number().int().min(1).max(16).default(8) });
export const productGridSchema = z.object({ title: z.string().max(120).default(''), categoryId: z.string().uuid().optional(), limit: z.number().int().min(1).max(24).default(12) });
