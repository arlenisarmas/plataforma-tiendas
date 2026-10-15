import { z } from 'zod';

const hex = z.string().regex(/^#[0-9a-f]{6}$/i);
const colorSchema = z.object({ primary: hex, accent: hex, background: hex, surface: hex, text: hex });

export const curatedPalettes = {
  calido: { primary: '#7D3036', accent: '#805014', background: '#FFFDF8', surface: '#FFF4E8', text: '#302621' },
  fresco: { primary: '#07567A', accent: '#176039', background: '#FFFFFF', surface: '#F3F7F9', text: '#172B36' },
  natural: { primary: '#285C3E', accent: '#72521A', background: '#FFFDF8', surface: '#F3F5E8', text: '#26382C' },
  elegante: { primary: '#34304D', accent: '#70406A', background: '#FFFFFF', surface: '#F6F4F8', text: '#24212C' },
  vibrante: { primary: '#7B2555', accent: '#07567A', background: '#FFFFFF', surface: '#FFF2F8', text: '#302136' },
} as const;

function luminance(hexColor: string): number {
  const rgb = /^#([0-9a-f]{6})$/i.exec(hexColor)?.[1];
  if (!rgb) return 0;
  const channels = [0, 2, 4].map((offset) => {
    const value = parseInt(rgb.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (channels[0] ?? 0) + 0.7152 * (channels[1] ?? 0) + 0.0722 * (channels[2] ?? 0);
}

export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05);
}

export const themeSchema = z.object({
  palette: z.enum(['calido', 'fresco', 'natural', 'elegante', 'vibrante', 'personalizada']),
  colors: colorSchema,
  fonts: z.enum(['moderna', 'clasica', 'amigable', 'robusta']),
  radius: z.enum(['recto', 'suave', 'redondo']),
  buttonStyle: z.enum(['solido', 'contorno']),
  header: z.object({ layout: z.enum(['centrado', 'izquierda']), showSearch: z.boolean(), announcementBlockId: z.string().optional() }),
  footer: z.object({ showSocial: z.boolean(), showPaymentIcons: z.boolean(), text: z.string().optional() }),
}).superRefine((theme, ctx) => {
  if ((['text', 'primary', 'accent'] as const).some((color) => contrastRatio(theme.colors[color], theme.colors.background) < 4.5))
    ctx.addIssue({ code: 'custom', path: ['colors'], message: 'WCAG AA contrast is required' });
});

export type Theme = z.infer<typeof themeSchema>;

export function createTheme(palette: keyof typeof curatedPalettes = 'fresco'): Theme {
  return { palette, colors: curatedPalettes[palette], fonts: 'moderna', radius: 'suave', buttonStyle: 'solido',
    header: { layout: 'izquierda', showSearch: false }, footer: { showSocial: false, showPaymentIcons: false } };
}

export function themeToCssVars(input: unknown): Record<string, string> {
  const theme = themeSchema.parse(input);
  return {
    '--color-primary': theme.colors.primary, '--color-accent': theme.colors.accent,
    '--color-background': theme.colors.background, '--color-surface': theme.colors.surface,
    '--color-text': theme.colors.text,
    '--theme-radius': { recto: '0', suave: '0.75rem', redondo: '1.5rem' }[theme.radius],
    '--theme-font-body': { moderna: 'Arial, sans-serif', clasica: 'Georgia, serif',
      amigable: 'Verdana, sans-serif', robusta: 'Tahoma, sans-serif' }[theme.fonts],
  };
}
