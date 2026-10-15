import type { ComponentType } from 'react';
import type { z } from 'zod';
import type { Theme } from './theme';

export type StoreContext = { storeId: string; locale: string; assetUrl: (assetId: string) => string | undefined };
export type BlockVariant = { id: string; i18n: { name: string; description?: string }; thumbnail: string };
export type FieldSpec = {
  name: string;
  kind: 'text' | 'textarea' | 'number' | 'toggle' | 'select' | 'image' | 'color-token' | 'link'
    | 'product-picker' | 'category-picker' | 'list';
  i18n: { label: string; help?: string; placeholder?: string };
  simple: boolean;
  options?: { value: string; i18nLabel: string }[];
  itemFields?: FieldSpec[];
  maxItems?: number;
  onlyInVariants?: string[];
};

export interface BlockDefinition<P extends z.ZodType = z.ZodType> {
  type: string;
  version: number;
  category: 'portada' | 'productos' | 'contenido' | 'confianza' | 'contacto';
  icon: string;
  i18n: { name: string; description: string };
  schema: P;
  defaults: z.infer<P>;
  fields: FieldSpec[];
  variants: BlockVariant[];
  defaultVariant: string;
  migrate?: (oldProps: unknown, fromVersion: number) => z.infer<P>;
  loader?: (props: z.infer<P>, ctx: StoreContext) => Promise<unknown>;
  Component: ComponentType<{ props: z.infer<P>; variant: string; data: unknown; theme: Theme; ctx: StoreContext }>;
}

export type BlockInstance = { id: string; type: string; version: number; variant?: string; props: unknown };
