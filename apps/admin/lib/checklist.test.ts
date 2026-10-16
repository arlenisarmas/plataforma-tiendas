import { expect, it } from 'vitest';
import { checklistState } from './checklist';

it('marks each setup step only after its own persisted state changes', () => {
  const empty = checklistState({ hasLogo: false, products: 0, payments: 0, shipping: 0, pages: 0, published: false });
  expect(Object.values(empty).every((done) => !done)).toBe(true);
  const progress = checklistState({ hasLogo: true, products: 1, payments: 0, shipping: 1, pages: 0, published: false });
  expect(progress).toEqual({ logo: true, product: true, payment: false, shipping: true, page: false, publish: false });
  const complete = checklistState({ hasLogo: true, products: 1, payments: 1, shipping: 1, pages: 1, published: true });
  expect(Object.values(complete).every(Boolean)).toBe(true);
});
