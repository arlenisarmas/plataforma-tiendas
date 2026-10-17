import { describe, expect, it } from 'vitest';
import { applyFilters } from './products/data';

describe('applyFilters (vista previa)', () => {
  const rows = [{ id: 'a', is_featured: true }, { id: 'b', is_featured: false }, { id: 'c', is_featured: true }];

  it('filtra por igualdad y respeta el límite', () => {
    expect(applyFilters(rows, { is_featured: 'eq.true', limit: '1' })).toEqual([{ id: 'a', is_featured: true }]);
  });

  it('ignora filtros que no son de igualdad', () => {
    expect(applyFilters(rows, { order: 'name.asc' })).toHaveLength(3);
  });
});
