import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { announcementBarDefinition } from './announcement-bar/definition';
import { imageWithTextDefinition } from './image-with-text/definition';
import { galleryDefinition } from './gallery/definition';
import { testimonialsDefinition } from './testimonials/definition';
import { faqDefinition } from './faq/definition';
import { contactDefinition } from './contact/definition';
import { Contact } from './contact/component';
import { Faq } from './faq/component';

describe('content blocks', () => {
  const definitions = [announcementBarDefinition, imageWithTextDefinition, galleryDefinition,
    testimonialsDefinition, faqDefinition, contactDefinition];

  it('accepts all defaults and rejects unsafe links', () => {
    for (const definition of definitions) {
      expect(definition.schema.safeParse(definition.defaults).success).toBe(true);
      expect(definition.variants.length).toBeGreaterThanOrEqual(2);
    }
    expect(announcementBarDefinition.schema.safeParse({ text: 'Hola', button: { label: 'Ver', href: 'javascript:alert(1)' } }).success).toBe(false);
    expect(contactDefinition.schema.safeParse({ title: 'Contacto', mapUrl: 'data:text/html,evil' }).success).toBe(false);
    expect(galleryDefinition.schema.safeParse({ images: Array.from({ length: 13 }, () => ({ assetId: crypto.randomUUID() })) }).success).toBe(false);
  });

  it('escapes user text and renders a native keyboard-operable FAQ', () => {
    const html = renderToStaticMarkup(<Faq props={{ title: '<script>', items: [{ question: '¿Envíos?', answer: '<img src=x>' }] }} variant="accordion" />);
    expect(html).toContain('<details role="group"');
    expect(html).toContain('<summary>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<img src=x>');
  });

  it('builds prefilled WhatsApp, phone, email and safe map links', () => {
    const html = renderToStaticMarkup(<Contact props={{ title: 'Contacto', whatsappMessage: 'Hola, quiero consultar.' }} variant="map"
      data={{ whatsapp: '+54 (911) 1111-1111', phone: '+54 11 1111-1111', email: 'hola@ejemplo.com',
        address: 'Calle 1', labels: { whatsapp: 'WhatsApp', phone: 'Teléfono', email: 'Email', address: 'Dirección', hours: 'Horarios' } }} />);
    expect(html).toContain('wa.me/5491111111111?text=Hola%2C%20quiero%20consultar.');
    expect(html).toContain('href="tel:+541111111111"');
    expect(html).toContain('mailto:hola@ejemplo.com');
    expect(html).toContain('maps.google.com/maps?q=Calle%201');
  });
});
