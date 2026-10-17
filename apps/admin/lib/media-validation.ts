import sharp from 'sharp';

const MAX_BYTES = 10 * 1024 * 1024;
export async function validateImage(file: File) {
  if (file.size === 0 || file.size > MAX_BYTES || file.type !== 'image/webp') return { error: 'format' as const };
  const bytes = Buffer.from(await file.arrayBuffer());
  try {
    const metadata = await sharp(bytes, { limitInputPixels: 2400 * 2400 }).metadata();
    if (metadata.format !== 'webp' || !metadata.width || !metadata.height ||
      metadata.width > 2400 || metadata.height > 2400) return { error: 'format' as const };
    return { bytes, width: metadata.width, height: metadata.height };
  } catch { return { error: 'format' as const }; }
}
