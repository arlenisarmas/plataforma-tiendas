import type { BlockDefinition } from '../types';
import { contentVariants, titleField } from '../content-utils';
import { imageWithTextSchema } from './schema';
import { ImageWithText } from './component';
export const imageWithTextDefinition = {
  type: 'image-with-text', version: 1, category: 'contenido', icon: 'image',
  i18n: { name: 'blocks.imageWithText', description: 'blocks.imageWithTextDescription' },
  schema: imageWithTextSchema, defaults: { title: '', body: '', image: { assetId: '00000000-0000-4000-8000-000000000000', alt: '' } },
  fields: [titleField, { name: 'body', kind: 'textarea', i18n: { label: 'blocks.richTextBody' }, simple: true },
    { name: 'image', kind: 'image', i18n: { label: 'blocks.heroImage' }, simple: true },
    { name: 'button.label', kind: 'text', i18n: { label: 'blocks.announcementButton' }, simple: false }],
  variants: contentVariants('imageWithText', ['left', 'right', 'overlay']), defaultVariant: 'left', Component: ImageWithText,
} satisfies BlockDefinition<typeof imageWithTextSchema>;
