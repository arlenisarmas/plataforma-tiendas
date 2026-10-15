export function thumbnailFor(type: string, variant: string): string {
  const left = variant === 'split' || variant === 'left' ? 0 : 60;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="72" viewBox="0 0 120 72"><rect width="120" height="72" fill="#f3f7f9"/><rect x="${left}" y="0" width="60" height="72" fill="#07567a"/><text x="60" y="40" text-anchor="middle" fill="${left ? '#07567a' : '#fff'}" font-size="9">${type}: ${variant}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
