import { describe, expect, it } from 'vitest';
import { buildSteps, resumeStep, stepDone } from './build-blocks';

const none = { logo: false, page: false, product: false, payment: false, shipping: false, publish: false };
const doneMap = (value: boolean) => Object.fromEntries(buildSteps.map((step) => [step, value])) as Record<(typeof buildSteps)[number], boolean>;

describe('armado guiado', () => {
  it('retoma en el último paso visitado', () => {
    expect(resumeStep(doneMap(false), { buildStep: 'products' })).toBe('products');
  });
  it('sin paso guardado, va al primero sin terminar', () => {
    expect(resumeStep({ ...doneMap(true), cover: false })).toBe('cover');
    expect(resumeStep(doneMap(true))).toBe('open');
  });
  it('ignora pasos guardados que ya no existen', () => {
    expect(resumeStep(doneMap(false), { buildStep: 'viejo' })).toBe('logo');
  });
  it('la barra superior se completa al confirmarla', () => {
    expect(stepDone('header', none, false)).toBe(false);
    expect(stepDone('header', none, false, { done: ['header'] })).toBe(true);
    expect(stepDone('logo', { ...none, logo: true }, false)).toBe(true);
  });
});
