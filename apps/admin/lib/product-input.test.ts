import { describe, expect, it } from 'vitest';
import { parseProductInput } from './product-input';

const base = { storeId: '00000000-0000-4000-8000-000000000001', name: 'Mesa Ratona', status: 'active',
  variants: [{ title: 'Único', options: {}, price: '15.000,50', stock: 3 }] };

describe('product input', () => {
  it('stores localized ARS prices in minor units', () => {
    const product = parseProductInput(base, 'ARS', 'es-AR');
    expect(product.slug).toBe('mesa-ratona');
    expect(product.variants[0]?.priceAmount).toBe(1500050);
  });
  it('rejects excessive precision and negative values', () => {
    expect(() => parseProductInput({ ...base, variants: [{ ...base.variants[0], price: '1,123' }] }, 'ARS', 'es-AR')).toThrow();
    expect(() => parseProductInput({ ...base, variants: [{ ...base.variants[0], price: '-2' }] }, 'ARS', 'es-AR')).toThrow();
  });
});
