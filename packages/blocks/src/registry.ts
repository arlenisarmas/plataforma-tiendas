import type { BlockDefinition } from './types';
import { heroDefinition } from './hero/definition';
import { richTextDefinition } from './rich-text/definition';
import { spacerDefinition } from './spacer/definition';
import { featuredProductsDefinition, categoryGridDefinition, productGridDefinition } from './products/definition';

export const registry = [heroDefinition, richTextDefinition, spacerDefinition, featuredProductsDefinition, categoryGridDefinition, productGridDefinition] as const;

export function getBlockDefinition(type: string): BlockDefinition | undefined {
  return registry.find((definition) => definition.type === type) as BlockDefinition | undefined;
}
