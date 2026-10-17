import type { BlockDefinition } from './types';
import { heroDefinition } from './hero/definition';
import { richTextDefinition } from './rich-text/definition';
import { spacerDefinition } from './spacer/definition';
import { featuredProductsDefinition, categoryGridDefinition, productGridDefinition } from './products/definition';
import { announcementBarDefinition } from './announcement-bar/definition';
import { imageWithTextDefinition } from './image-with-text/definition';
import { galleryDefinition } from './gallery/definition';
import { testimonialsDefinition } from './testimonials/definition';
import { faqDefinition } from './faq/definition';
import { contactDefinition } from './contact/definition';

export const registry = [heroDefinition, richTextDefinition, spacerDefinition, featuredProductsDefinition, categoryGridDefinition, productGridDefinition,
  announcementBarDefinition, imageWithTextDefinition, galleryDefinition, testimonialsDefinition, faqDefinition, contactDefinition] as const;

export function getBlockDefinition(type: string): BlockDefinition | undefined {
  return registry.find((definition) => definition.type === type) as BlockDefinition | undefined;
}
