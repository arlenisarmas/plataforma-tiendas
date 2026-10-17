import { z } from 'zod';
import { createTheme, getBlockDefinition, themeSchema, type Theme } from '@plataforma/blocks';

export { getBlockDefinition };

/** Esquema de props del bloque de portada (definido en @plataforma/blocks). */
export function heroSchemaFor() {
  const definition = getBlockDefinition('hero');
  if (!definition) throw new Error('hero block missing');
  return definition.schema;
}

/** Recorrido guiado: un paso por parte de la página, en el orden en que se ve de arriba hacia abajo. */
export const buildSteps = ['logo', 'header', 'cover', 'products', 'payments', 'contact', 'open'] as const;
export type BuildStep = (typeof buildSteps)[number];

export function isBuildStep(value: unknown): value is BuildStep {
  return typeof value === 'string' && (buildSteps as readonly string[]).includes(value);
}

/** Progreso guardado en `stores.onboarding`: último paso visitado y pasos de diseño confirmados. */
export const onboardingSchema = z.object({
  buildStep: z.string().optional(),
  done: z.array(z.string()).optional(),
}).loose().catch({});
export type Onboarding = z.infer<typeof onboardingSchema>;

export type BuildChecks = { logo: boolean; page: boolean; product: boolean; payment: boolean; shipping: boolean; publish: boolean };

export function stepDone(step: BuildStep, checks: BuildChecks, hasContact: boolean, onboarding: Onboarding = {}): boolean {
  const confirmed = onboarding.done ?? [];
  switch (step) {
    case 'logo': return checks.logo || confirmed.includes('logo');
    case 'header': return confirmed.includes('header');
    case 'cover': return checks.page;
    case 'products': return checks.product;
    case 'payments': return checks.payment && checks.shipping;
    case 'contact': return hasContact;
    case 'open': return checks.publish;
  }
}

/** Paso donde retomar: el último visitado; si no hay, el primero sin terminar. */
export function resumeStep(done: Record<BuildStep, boolean>, onboarding: Onboarding = {}): BuildStep {
  if (isBuildStep(onboarding.buildStep)) return onboarding.buildStep;
  return buildSteps.find((item) => !done[item]) ?? 'open';
}

export type HeaderChoice = { palette: 'calido' | 'fresco' | 'natural' | 'elegante' | 'vibrante'; layout: 'izquierda' | 'centrado';
  style: 'claro' | 'color'; fonts: 'moderna' | 'clasica' | 'amigable' | 'robusta' };

/** Arma el tema con las elecciones de la barra superior, conservando el resto del tema actual. */
export function headerTheme(current: unknown, choice: HeaderChoice): Theme {
  const base = themeSchema.safeParse(current);
  const theme = base.success ? base.data : createTheme(choice.palette);
  return themeSchema.parse({ ...theme, palette: choice.palette, colors: createTheme(choice.palette).colors, fonts: choice.fonts,
    header: { ...theme.header, layout: choice.layout, style: choice.style } });
}

/** Elección inicial de la barra superior a partir del tema guardado. */
export function headerChoice(current: unknown): HeaderChoice {
  const parsed = themeSchema.safeParse(current);
  const theme = parsed.success ? parsed.data : createTheme();
  return { palette: theme.palette === 'personalizada' ? 'fresco' : theme.palette, layout: theme.header.layout,
    style: theme.header.style, fonts: theme.fonts };
}
