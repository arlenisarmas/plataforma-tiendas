import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { validateImage } from './media-validation';

describe('uploaded image validation', () => {
  it('reads real WebP dimensions from the file bytes', async () => {
    const bytes = await sharp({ create: { width: 48, height: 32, channels: 3, background: 'white' } }).webp().toBuffer();
    const image = await validateImage(new File([bytes], 'photo.webp', { type: 'image/webp' }));
    expect(image).toMatchObject({ width: 48, height: 32 });
  });

  it('rejects a fake MIME label and files over 10 MB', async () => {
    const fake = new File([new Uint8Array([1, 2, 3])], 'fake.webp', { type: 'image/webp' });
    expect(await validateImage(fake)).toEqual({ error: 'format' });
    const tooLarge = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'large.webp', { type: 'image/webp' });
    expect(await validateImage(tooLarge)).toEqual({ error: 'format' });
  });
});
