import { getBlockDefinition } from '@plataforma/blocks';

export { getBlockDefinition };

/** Esquema de props del bloque de portada (definido en @plataforma/blocks). */
export function heroSchemaFor() {
  const definition = getBlockDefinition('hero');
  if (!definition) throw new Error('hero block missing');
  return definition.schema;
}

/** Progreso del recorrido guiado: qué pasos están completos según el checklist de la tienda. */
export const buildSteps = ['cover', 'products', 'payments', 'contact', 'open'] as const;
export type BuildStep = (typeof buildSteps)[number];

export function stepDone(step: BuildStep, checks: { page: boolean; product: boolean; payment: boolean; shipping: boolean; publish: boolean }, hasContact: boolean): boolean {
  switch (step) {
    case 'cover': return checks.page;
    case 'products': return checks.product;
    case 'payments': return checks.payment && checks.shipping;
    case 'contact': return hasContact;
    case 'open': return checks.publish;
  }
}
