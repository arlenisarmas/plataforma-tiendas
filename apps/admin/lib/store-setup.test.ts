import { describe, expect, it } from 'vitest';
import { countryDefaults, storeSetupSchema } from './store-setup';

describe('store setup', () => {
  it('accepts each supported country with its suggested settings', () => {
    for (const [country, defaults] of Object.entries(countryDefaults)) {
      expect(
        storeSetupSchema.safeParse({
          name: 'Mi tienda',
          slug: 'mi-tienda',
          industry: 'general',
          country,
          locale: defaults.locale,
          timezone: defaults.timezone,
          palette: 'fresco',
        }).success,
      ).toBe(true);
    }
  });
  it('includes the countries where the family stores are planned', () => {
    for (const code of ['AR', 'CL', 'ES', 'US', 'VE'])
      expect(Object.keys(countryDefaults)).toContain(code);
    expect(countryDefaults.ES.currency).toBe('EUR');
    expect(countryDefaults.VE.currency).toBe('USD');
  });
  it('rejects invalid addresses and time zones', () => {
    const valid = {
      name: 'Mi tienda',
      slug: 'mi-tienda',
      industry: 'general',
      country: 'AR',
      locale: 'es-AR',
      timezone: 'America/Argentina/Buenos_Aires',
      palette: 'fresco',
    };
    expect(storeSetupSchema.safeParse({ ...valid, slug: 'Bad Slug' }).success).toBe(false);
    expect(storeSetupSchema.safeParse({ ...valid, timezone: 'invalid' }).success).toBe(false);
  });
});
