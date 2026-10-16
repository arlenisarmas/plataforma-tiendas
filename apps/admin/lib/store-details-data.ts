import { z } from 'zod';

const webUrl = z.string().trim().refine((value) => {
  if (!value) return true;
  try { const url = new URL(value); return url.protocol === 'https:' && Boolean(url.hostname); }
  catch { return false; }
});
export const detailsSchema = z.object({ storeId: z.uuid(), email: z.union([z.email(), z.literal('')]),
  phone: z.string().trim().max(40), whatsapp: z.string().trim().max(40), address: z.string().trim().max(200),
  instagram: webUrl, facebook: webUrl });

type Details = z.infer<typeof detailsSchema>;
const existingSchema = z.record(z.string(), z.json());
const socialSchema = z.array(z.object({ label: z.string(), url: webUrl }));

export function contactFromDetails(input: Details, previous: unknown) {
  const old = existingSchema.safeParse(previous);
  const replaced = ['email', 'phone', 'whatsapp', 'address', 'instagram', 'facebook', 'social'];
  const rest = old.success ? Object.fromEntries(Object.entries(old.data).filter(([key]) => !replaced.includes(key))) : {};
  const social = socialSchema.safeParse(old.success ? old.data.social : undefined);
  const links = social.success ? social.data.filter((item) => item.label !== 'Instagram' && item.label !== 'Facebook') : [];
  if (input.instagram) links.push({ label: 'Instagram', url: input.instagram });
  if (input.facebook) links.push({ label: 'Facebook', url: input.facebook });
  return { ...rest, ...(input.email ? { email: input.email } : {}),
    ...(input.phone ? { phone: input.phone } : {}), ...(input.whatsapp ? { whatsapp: input.whatsapp } : {}),
    ...(input.address ? { address: input.address } : {}), ...(links.length ? { social: links } : {}) };
}

export function socialLink(contact: unknown, label: 'Instagram' | 'Facebook'): string {
  const parsed = z.object({ social: socialSchema.optional() }).safeParse(contact);
  return parsed.success ? parsed.data.social?.find((item) => item.label === label)?.url ?? '' : '';
}
