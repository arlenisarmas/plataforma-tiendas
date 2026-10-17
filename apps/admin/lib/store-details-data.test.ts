import { describe, expect, it } from 'vitest';
import { contactFromDetails, detailsSchema, socialLink } from './store-details-data';

describe('store contact details', () => {
  const input = { storeId: '11111111-1111-4111-8111-111111111111', email: '', phone: '', whatsapp: '',
    address: '', instagram: 'https://instagram.com/shop', facebook: '' };
  it('keeps other contact data and stores social links in the storefront format', () => {
    const result = contactFromDetails(input, { hours: '9-18', email: 'old@example.com',
      social: [{ label: 'Other', url: 'https://example.com' }] });
    expect(result).toEqual({ hours: '9-18', social: [{ label: 'Other', url: 'https://example.com' },
      { label: 'Instagram', url: input.instagram }] });
    expect(socialLink(result, 'Instagram')).toBe(input.instagram);
  });
  it('rejects unsafe links', () => {
    expect(detailsSchema.safeParse({ ...input, instagram: 'javascript:alert(1)' }).success).toBe(false);
  });
});
