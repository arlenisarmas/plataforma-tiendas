import { z } from 'zod';
import type { BlockDefinition } from '../types';
import { contentVariants, titleField } from '../content-utils';
import { readView } from '../products/data';
import { contactSchema, contactDataSchema } from './schema';
import { Contact } from './component';
export const contactDefinition = {
  type: 'contact', version: 1, category: 'contacto', icon: 'contact',
  i18n: { name: 'blocks.contact', description: 'blocks.contactDescription' },
  schema: contactSchema, defaults: { title: '', whatsappMessage: '' },
  fields: [titleField, { name: 'whatsappMessage', kind: 'text', i18n: { label: 'blocks.contactMessage' }, simple: true },
    { name: 'mapUrl', kind: 'link', i18n: { label: 'blocks.contactMap' }, simple: false }],
  variants: contentVariants('contact', ['cards', 'simple-list', 'map']), defaultVariant: 'cards',
  loader: async (_props, ctx) => {
    const [{ messages }, stores] = await Promise.all([import('@plataforma/i18n'), readView('stores', z.object({ id: z.uuid(), contact: z.unknown() }), ctx)]);
    const locale = ctx.locale in messages ? ctx.locale as keyof typeof messages : 'es-419';
    const parsed = contactDataSchema.safeParse(stores[0]?.contact);
    if (!parsed.success) return null;
    const labels = messages[locale].blocks;
    return { ...parsed.data, labels: { whatsapp: labels.contactWhatsapp, phone: labels.contactPhone,
      email: labels.contactEmail, address: labels.contactAddress, hours: labels.contactHours } };
  },
  Component: Contact,
} satisfies BlockDefinition<typeof contactSchema>;
