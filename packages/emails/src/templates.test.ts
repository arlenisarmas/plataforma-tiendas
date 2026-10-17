import { describe, expect, it } from 'vitest';
import { renderEmail, type EmailKind } from './templates';
import { sampleCopy } from './sample-copy';

describe('transactional templates', () => {
  const kinds: EmailKind[] = ['orderConfirmation', 'paymentConfirmed', 'orderReady', 'newOrder', 'teamInvitation'];
  for (const kind of kinds) it(`renders ${kind} with store branding`, async () => {
    const result = await renderEmail({ kind, copy: sampleCopy, storeName: 'Tienda Ejemplo',
      orderNumber: 1234, accentColor: '#07567a', orderUrl: 'https://example.test/order',
      inviteUrl: 'https://example.test/invite', paymentInstructions: 'Alias de prueba' });
    expect(result.subject).toContain('Tienda Ejemplo');
    expect(result.html).toContain('Tienda Ejemplo');
    expect(result.html).toContain('max-width:560px');
  });
  it('includes manual payment instructions and order link', async () => {
    const result = await renderEmail({ kind: 'orderConfirmation', copy: sampleCopy, storeName: 'Demo',
      orderNumber: 1234, paymentInstructions: 'Alias de prueba', orderUrl: 'https://example.test/order' });
    expect(result.html).toContain('Alias de prueba');
    expect(result.html).toContain('https://example.test/order');
  });
});
