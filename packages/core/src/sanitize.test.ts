import { describe, expect, it } from 'vitest';
import { sanitizeRichText } from './sanitize';

describe('rich text', () => {
  it('renders simple formatting and lists', () => {
    expect(sanitizeRichText('**Hola** *mundo*\n- Uno\n- Dos')).toBe(
      '<p><strong>Hola</strong> <em>mundo</em></p><ul><li>Uno</li><li>Dos</li></ul>',
    );
  });
  it('allows only http and https links', () => {
    expect(sanitizeRichText('[Abrir](https://example.com)')).toContain(
      'href="https://example.com"',
    );
    expect(sanitizeRichText('[Abrir](javascript:alert(1))')).not.toContain('href=');
  });
  it('escapes raw HTML and attributes', () => {
    const html = sanitizeRichText(
      '<script>alert(1)</script> [X](https://a.test/"onmouseover="evil)',
    );
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('onmouseover="evil');
  });
});
