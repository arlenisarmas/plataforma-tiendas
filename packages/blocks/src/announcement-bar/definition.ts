import type { BlockDefinition } from '../types';
import { contentVariants } from '../content-utils';
import { announcementBarSchema } from './schema';
import { AnnouncementBar } from './component';
export const announcementBarDefinition = {
  type: 'announcement-bar', version: 1, category: 'contenido', icon: 'megaphone',
  i18n: { name: 'blocks.announcementBar', description: 'blocks.announcementBarDescription' },
  schema: announcementBarSchema, defaults: { text: '' },
  fields: [{ name: 'text', kind: 'text', i18n: { label: 'blocks.announcementText' }, simple: true },
    { name: 'button.label', kind: 'text', i18n: { label: 'blocks.announcementButton' }, simple: false },
    { name: 'button.href', kind: 'link', i18n: { label: 'blocks.link' }, simple: false }],
  variants: contentVariants('announcementBar', ['fixed', 'sliding', 'button']), defaultVariant: 'fixed', Component: AnnouncementBar,
} satisfies BlockDefinition<typeof announcementBarSchema>;
