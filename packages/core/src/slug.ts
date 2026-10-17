export const SLUG_PATTERN = /^[a-z0-9](-?[a-z0-9])*$/;

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/gi, 'n')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function isValidSlug(value: string): boolean {
  return SLUG_PATTERN.test(value);
}

export function isValidStoreSlug(value: string): boolean {
  return value.length >= 3 && value.length <= 40 && isValidSlug(value);
}
