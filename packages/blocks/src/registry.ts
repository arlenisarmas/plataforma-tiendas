import type { BlockDefinition } from './types';
import { heroDefinition } from './hero/definition';
import { richTextDefinition } from './rich-text/definition';
import { spacerDefinition } from './spacer/definition';

export const registry = [heroDefinition, richTextDefinition, spacerDefinition] as const;

export function getBlockDefinition(type: string): BlockDefinition | undefined {
  return registry.find((definition) => definition.type === type) as BlockDefinition | undefined;
}
