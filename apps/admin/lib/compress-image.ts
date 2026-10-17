const OUTPUT_BYTES = 500 * 1024;

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.size === 0 || file.size > 10 * 1024 * 1024)
    throw new Error('format');
  const bitmap = await createImageBitmap(file);
  try {
    let scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
    for (let attempt = 0; attempt < 12; attempt++) {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('format');
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const quality = Math.max(.35, .85 - attempt * .055);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
      if (!blob || blob.type !== 'image/webp') throw new Error('format');
      if (blob.size < OUTPUT_BYTES) return new File([blob], 'image.webp', { type: 'image/webp' });
      scale *= .8;
    }
    throw new Error('format');
  } finally { bitmap.close(); }
}
