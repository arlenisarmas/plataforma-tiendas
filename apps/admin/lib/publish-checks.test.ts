import { describe, expect, it } from 'vitest';
import { canPublish } from './publish-checks';

describe('publish readiness', () => {
  it('requires every prerequisite', () => {
    const ready = { home: true, product: true, payment: true, shipping: true };
    expect(canPublish(ready)).toBe(true);
    for (const key of Object.keys(ready) as (keyof typeof ready)[])
      expect(canPublish({ ...ready, [key]: false })).toBe(false);
  });
});
