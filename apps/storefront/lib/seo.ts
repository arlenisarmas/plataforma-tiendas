export function storeUrl(host: string): URL | null {
  const normalized = host.toLowerCase().replace(/:\d+$/, '');
  if (!/^[a-z0-9.-]{1,253}$/.test(normalized) || normalized === 'localhost' || normalized.endsWith('.localhost')) return null;
  return new URL(`https://${normalized}`);
}

export function publicPaths(pages: { slug: string | null }[], products: { slug: string }[]): string[] {
  const paths = new Set(['/']);
  for (const page of pages) if (page.slug && /^[a-z0-9-]+$/.test(page.slug)) paths.add(`/${page.slug}`);
  for (const product of products) if (/^[a-z0-9-]+$/.test(product.slug)) paths.add(`/producto/${product.slug}`);
  return [...paths];
}
