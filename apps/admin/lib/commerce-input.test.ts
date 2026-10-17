import { describe, expect, it } from 'vitest';
import { parsePayment, parseShipping } from './commerce-input';

const storeId = 'a0000000-0000-4000-8000-000000000001';
describe('commerce settings', () => {
  it('stores pickup without shipping charges', () => {
    expect(parseShipping({ storeId, kind: 'pickup', name: 'Retiro', description: '', price: '999',
      freeOver: '', active: true }, 'ARS', 'es-AR').priceAmount).toBe('0');
  });
  it('converts shipping fees to minor units and rejects negatives', () => {
    expect(parseShipping({ storeId, kind: 'flat_rate', name: 'Envío', description: '', price: '1500',
      freeOver: '5000', active: true }, 'ARS', 'es-AR').freeOverAmount).toBe('500000');
    expect(() => parseShipping({ storeId, kind: 'flat_rate', name: 'Envío', description: '', price: '-1',
      freeOver: '', active: true }, 'ARS', 'es-AR')).toThrow();
  });
  it('requires guided payment fields', () => {
    expect(parsePayment({ storeId, method: 'transferencia', displayName: 'Transferencia',
      fields: { holder: 'Ana', bank: 'Banco', account: 'alias.test' } }).fields.account).toBe('alias.test');
    expect(() => parsePayment({ storeId, method: 'zelle', displayName: 'Zelle',
      fields: { holder: 'Ana', email: 'wrong' } })).toThrow();
  });
});
